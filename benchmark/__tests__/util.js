import json2md from "json2md";
import fs from "fs/promises";

export function formatGas(gas) {
  if (gas < 10 ** 12) {
    let tGas = gas / 10 ** 12;
    let roundTGas = Math.round(tGas * 100000) / 100000;
    return roundTGas + "T";
  }
  let tGas = gas / 10 ** 12;
  let roundTGas = Math.round(tGas * 100) / 100;
  return roundTGas + "T";
}

export function gasBreakdown(outcome) {
  return new Map(
    outcome.metadata.gas_profile.map((g) => {
      return [g.cost, Number(g.gas_used)];
    })
  );
}

export function logTestResults(testResults) {
  // Determine which function to use based on the structure of the results
  const isMinimal = testResults.result.receipts_outcome.length === 2;
  const generateGasObjectFn = isMinimal
    ? generateMinimalGasObject
    : generateGasObject;

  const gasObject = generateGasObjectFn(testResults);

  // Convert the gas object to a table-friendly format
  const breakdownEntries = Object.entries(gasObject.gasBreakdownForReceipt);
  const breakdownRows = breakdownEntries.map(([key, value]) => ({
    Description: key,
    GasUsed: value,
  }));

  const data = [
    {
      Description: "Gas Used to Convert Transaction to Receipt",
      GasUsed: gasObject.gasUsedToConvertTransactionToReceipt,
    },
    {
      Description: "Gas Used to Execute Receipt",
      GasUsed: gasObject.gasUsedToExecuteReceipt,
    },
    ...breakdownRows,
    {
      Description: "Gas Used to Refund Unused Gas",
      GasUsed: gasObject.gasUsedToRefundUnusedGas,
    },
    { Description: "Total Gas Used", GasUsed: gasObject.totalGasUsed },
  ];

  // Determine column widths
  const maxDescriptionLength = Math.max(
    ...data.map((row) => row.Description.length)
  );
  const descriptionWidth = maxDescriptionLength + 4;
  const gasWidth = 15; // Increased width for better formatting

  // Create header and separator lines
  const header = `| ${"Description".padEnd(
    descriptionWidth
  )} | ${"GasUsed".padEnd(gasWidth)} |`;
  const separator = `|${"-".repeat(descriptionWidth + 2)}|${"-".repeat(
    gasWidth + 2
  )}|`;

  // Create rows with separators
  const rows = data
    .map((row) => {
      return `| ${row.Description.padEnd(
        descriptionWidth
      )} | ${row.GasUsed.padEnd(gasWidth)} |`;
    })
    .join("\n" + separator + "\n");

  // Print the results
  console.log("");
  console.log(separator);
  console.log(header);
  console.log(separator);
  console.log(rows);
  console.log(separator);
}

export function generateMinimalGasObject(testMinimalResult) {
  const mapResult = gasBreakdown(
    testMinimalResult.result.receipts_outcome[0].outcome
  );

  const gasBreakdownResults = formatGasBreakdownResults(mapResult);

  return {
    gasUsedToConvertTransactionToReceipt: formatGas(
      testMinimalResult.result.transaction_outcome.outcome.gas_burnt
    ),
    gasUsedToExecuteReceipt: formatGas(
      testMinimalResult.result.receipts_outcome[0].outcome.gas_burnt
    ),
    gasBreakdownForReceipt: gasBreakdownResults,
    gasUsedToRefundUnusedGas: formatGas(
      testMinimalResult.result.receipts_outcome[1].outcome.gas_burnt
    ),
    totalGasUsed: formatGas(
      testMinimalResult.result.transaction_outcome.outcome.gas_burnt +
        testMinimalResult.result.receipts_outcome[0].outcome.gas_burnt +
        testMinimalResult.result.receipts_outcome[1].outcome.gas_burnt
    ),
  };
}

export function generateGasObject(testResult) {
  const mapResult = gasBreakdown(testResult.result.receipts_outcome[0].outcome);

  const gasBreakdownResults = formatGasBreakdownResults(mapResult);

  return {
    gasUsedToConvertTransactionToReceipt: formatGas(
      testResult.result.transaction_outcome.outcome.gas_burnt
    ),
    gasUsedToExecuteReceipt: formatGas(
      testResult.result.receipts_outcome[0].outcome.gas_burnt
    ),
    gasBreakdownForReceipt: gasBreakdownResults,
    gasUsedToExecuteCrossContractCall: formatGas(
      testResult.result.receipts_outcome[1].outcome.gas_burnt
    ),
    gasUsedToRefundUnusedGasForCrossContractCall: formatGas(
      testResult.result.receipts_outcome[2].outcome.gas_burnt
    ),
    gasUsedToRefundUnusedGas: formatGas(
      testResult.result.receipts_outcome[3].outcome.gas_burnt
    ),
    totalGasUsed: formatGas(
      testResult.result.transaction_outcome.outcome.gas_burnt +
        testResult.result.receipts_outcome[0].outcome.gas_burnt +
        testResult.result.receipts_outcome[1].outcome.gas_burnt +
        testResult.result.receipts_outcome[2].outcome.gas_burnt +
        testResult.result.receipts_outcome[3].outcome.gas_burnt
    ),
  };
}

function formatGasBreakdownResults(resultsMap) {
  return Array.from(resultsMap).reduce((acc, [key, value]) => {
    acc[key] = formatGas(value);
    return acc;
  }, {});
}

/**
 * Converts JSON data into a Markdown table with a title and writes it to a .md file.
 *
 * @param {string} title - The title for the Markdown document (H1).
 * @param {Array} data - The JSON data to be converted into a Markdown table.
 * @param {string} fileName - The name of the Markdown file to be created.
 * @returns {Promise<void>} - A promise that resolves when the file is written.
 */
export async function jsonToMarkdown(title, data, fileName) {
  const sortedJsonData = sortJsonData(data);

  if (typeof sortedJsonData !== "object" || sortedJsonData === null) {
    throw new Error("Expected sortedJsonData to be an object.");
  }

  const markdownSections = Object.entries(sortedJsonData).map(
    ([name, details]) => {
      const headers = ["Metric", "Rust", "JS"];

      const metrics = new Set();
      const rows = [];

      if (details.gasUsedToConvertTransactionToReceipt) {
        rows.push([
          "Convert transaction to receipt",
          details.gasUsedToConvertTransactionToReceipt,
          "",
        ]);
      }
      if (details.gasUsedToExecuteReceipt) {
        rows.push([
          "Execute the receipt (actual contract call)",
          details.gasUsedToExecuteReceipt,
          "",
        ]);
      }

      if (details.gasBreakdownForReceipt) {
        const breakdown = details.gasBreakdownForReceipt;
        Object.keys(breakdown).forEach((subMetric) => {
          metrics.add(subMetric);
          rows.push([subMetric, breakdown[subMetric], ""]);
        });
      } else {
        Object.keys(details).forEach((metric) => {
          metrics.add(metric);
          rows.push([metric, details[metric], ""]);
        });
      }

      const jsEntry = Object.entries(sortedJsonData).find(
        ([key, _]) => key.startsWith("JS") && key.includes(name.split("_")[1])
      );
      if (jsEntry) {
        const [, jsDetails] = jsEntry;

        if (jsDetails.gasBreakdownForReceipt) {
          const breakdown = jsDetails.gasBreakdownForReceipt;
          Object.keys(breakdown).forEach((subMetric) => {
            const row = rows.find((r) => r[0] === subMetric);
            if (row) {
              row[2] = breakdown[subMetric];
            }
          });
        } else {
          Object.keys(jsDetails).forEach((metric) => {
            const row = rows.find((r) => r[0] === metric);
            if (row) {
              row[2] = jsDetails[metric];
            }
          });
        }

        if (jsDetails.gasUsedToConvertTransactionToReceipt) {
          const row = rows.find(
            (r) => r[0] === "Convert transaction to receipt"
          );
          if (row) row[2] = jsDetails.gasUsedToConvertTransactionToReceipt;
        }
        if (jsDetails.gasUsedToExecuteReceipt) {
          const row = rows.find(
            (r) => r[0] === "Execute the receipt (actual contract call)"
          );
          if (row) row[2] = jsDetails.gasUsedToExecuteReceipt;
        }
      }

      rows.push([
        "Gas used to refund unused gas",
        details.gasUsedToRefundUnusedGas,
        jsEntry ? jsEntry[1].gasUsedToRefundUnusedGas : "",
      ]);
      rows.push([
        "Total gas used",
        details.totalGasUsed,
        jsEntry ? jsEntry[1].totalGasUsed : "",
      ]);

      return {
        h3: name,
        table: {
          headers,
          rows,
        },
      };
    }
  );

  const markdown = json2md([
    { h1: title },
    ...filterMarkdownSections(markdownSections),
  ]);

  await fs.writeFile(`${fileName}.md`, markdown);

  return markdown;
}

/**
 * Sorts JSON data according to a predefined order and converts it into an object.
 *
 * @param {Object} data - The JSON data to be sorted.
 * @returns {Object} - The sorted JSON data as an object with ordered properties.
 */
function sortJsonData(data) {
  const order = [
    "RS_lowlevel_API_contract",
    "JS_lowlevel_API_contract",
    "RS_lowlevel_minimal_contract",
    "JS_lowlevel_minimal_contract",
    "RS_highlevel_collection_contract",
    "JS_highlevel_collection_contract",
    "RS_highlevel_minimal_contract",
    "JS_highlevel_minimal_contract",
    "RS_promise_batch_deploy_contract_and_call",
    "JS_promise_batch_deploy_contract_and_call",
    "RS_expensive_contract_100_times",
    "JS_expensive_contract_100_times",
    "RS_expensive_contract_10000_times",
    "JS_expensive_contract_10000_times",
    "RS_expensive_contract_20000_times",
    "JS_expensive_contract_20000_times",
  ];

  const sortedData = {};

  order.forEach((key) => {
    if (data[key]) {
      sortedData[key] = data[key];
    }
  });

  return sortedData;
}

/**
 * Filters the markdownSections containing redundant data before including them in the markdown file.
 *
 * @param {Array} sections - The array of markdown sections data.
 * @returns {Array} - The filtered markdown sections data.
 */
function filterMarkdownSections(sections) {
  const filteredSections = [];
  const rsBaseNames = new Set();

  sections.forEach((section) => {
    if (section.h3.startsWith("RS_")) {
      const baseName = section.h3.replace(/^RS_/, "");
      rsBaseNames.add(baseName);
    }
  });

  sections.forEach((section) => {
    const baseName = section.h3.replace(/^RS_/, "").replace(/^JS_/, "");

    if (section.h3.startsWith("RS_")) {
      filteredSections.push({ ...section, h3: baseName });
    } else if (section.h3.startsWith("JS_") && !rsBaseNames.has(baseName)) {
      filteredSections.push({ ...section, h3: baseName });
    }
  });

  return filteredSections;
}
