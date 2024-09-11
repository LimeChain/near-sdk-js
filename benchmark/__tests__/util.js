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

/**
 * Logs the gas usage breakdown from test results in a table format.
 *
 * This function determines whether the test results are minimal or full based on
 * the number of receipts outcomes. It then generates a gas usage object using the
 * appropriate flag, converts this object into a table-friendly format, and logs
 * the data in a well-formatted table.
 *
 * @param {Object} testResults - The test results object containing gas usage metrics.
 */
export function logTestResults(testResults) {
  // Determine which function to use based on the structure of the results
  const isMinimal = testResults.result.receipts_outcome.length === 2;

  // Generate the gas object with the appropriate flag
  const gasObject = generateGasObject(testResults, isMinimal);

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
  )} | ${"Gas Used".padEnd(gasWidth)} |`;
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
    .join(`\n${separator}\n`);

  // Print the results
  console.log("");
  console.log(separator);
  console.log(header);
  console.log(separator);
  console.log(rows);
  console.log(separator);
}

/**
 * Generates a gas usage breakdown object from a test result.
 *
 * @param {Object} testResult - The result of a test execution, which includes transaction and receipt outcomes.
 * @param {boolean} [isMinimal=false] - If true, includes only minimal gas usage data; otherwise, includes additional cross-contract call and refund data.
 * @returns {Object} An object containing formatted gas usage values, including:
 *   - gasUsedToConvertTransactionToReceipt: Gas used to convert the transaction to a receipt.
 *   - gasUsedToExecuteReceipt: Gas used to execute the receipt.
 *   - gasBreakdownForReceipt: Formatted gas breakdown results for the receipt.
 *   - gasUsedToExecuteCrossContractCall: Gas used to execute any cross-contract calls (if not minimal).
 *   - gasUsedToRefundUnusedGasForCrossContractCall: Gas used to refund unused gas for cross-contract calls (if not minimal).
 *   - gasUsedToRefundUnusedGas: Gas used to refund any unused gas (if not minimal).
 *   - totalGasUsed: Total gas used including all relevant transactions and receipts.
 */
export function generateGasObject(testResult, isMinimal = false) {
  // Initialize gas breakdown
  const gasBreakdownForReceipt = gasBreakdown(
    testResult.result.receipts_outcome[0].outcome
  );

  const formattedGasBreakdown = formatGasBreakdownResults(
    gasBreakdownForReceipt
  );

  // Common values
  const gasUsedToConvertTransactionToReceipt = formatGas(
    testResult.result.transaction_outcome.outcome.gas_burnt
  );

  const gasUsedToExecuteReceipt = formatGas(
    testResult.result.receipts_outcome[0].outcome.gas_burnt
  );

  // Initialize optional values
  let gasUsedToExecuteCrossContractCall = undefined;
  let gasUsedToRefundUnusedGasForCrossContractCall = undefined;

  let gasUsedToRefundUnusedGas = formatGas(
    testResult.result.receipts_outcome[1]?.outcome.gas_burnt ?? 0
  );

  // If not minimal, set additional values
  if (!isMinimal) {
    gasUsedToExecuteCrossContractCall = formatGas(
      testResult.result.receipts_outcome[1]?.outcome.gas_burnt ?? 0
    );
    gasUsedToRefundUnusedGasForCrossContractCall = formatGas(
      testResult.result.receipts_outcome[2]?.outcome.gas_burnt ?? 0
    );
    gasUsedToRefundUnusedGas = formatGas(
      testResult.result.receipts_outcome[3]?.outcome.gas_burnt ?? 0
    );
  }

  // Calculate total gas used
  const totalGasUsed = formatGas(
    testResult.result.transaction_outcome.outcome.gas_burnt +
      testResult.result.receipts_outcome[0].outcome.gas_burnt +
      (isMinimal
        ? testResult.result.receipts_outcome[1]?.outcome.gas_burnt ?? 0
        : (testResult.result.receipts_outcome[1]?.outcome.gas_burnt ?? 0) +
          (testResult.result.receipts_outcome[2]?.outcome.gas_burnt ?? 0) +
          (testResult.result.receipts_outcome[3]?.outcome.gas_burnt ?? 0))
  );

  return {
    gasUsedToConvertTransactionToReceipt,
    gasUsedToExecuteReceipt,
    gasBreakdownForReceipt: formattedGasBreakdown,
    gasUsedToExecuteCrossContractCall,
    gasUsedToRefundUnusedGasForCrossContractCall,
    gasUsedToRefundUnusedGas,
    totalGasUsed,
  };
}

/**
 * Formats the gas breakdown results.
 *
 * @param {Map<string, number>} resultsMap - A map where keys represent gas usage categories and values represent the corresponding gas usage.
 * @returns {Object} An object with formatted gas usage values for each category.
 */
function formatGasBreakdownResults(resultsMap) {
  return Array.from(resultsMap).reduce((acc, [key, value]) => {
    acc[key] = formatGas(value);
    return acc;
  }, {});
}

/**
 * Retrieves an existing row with the specified description from the rows array,
 * or initializes a new row if none exists.
 *
 * @param {Array<Array<string>>} rows - The array of rows where each row is an array of values.
 * @param {string} description - The description for the row.
 * @param {string} defaultValue - The default value to initialize the row with.
 * @returns {Array<string>} - The row array for the given description.
 */
function getOrCreateRow(rows, description, defaultValue) {
  let row = rows.find((r) => r[0] === description);
  if (!row) {
    row = [description, defaultValue, ""];
    rows.push(row);
  }
  return row;
}

/**
 * Updates the value at a specific index in a row with the given description.
 * If the row does not exist, it will be created using getOrCreateRow.
 *
 * @param {Array<Array<string>>} rows - The array of rows where each row is an array of values.
 * @param {string} description - The description for the row to update.
 * @param {number} valueIndex - The index in the row where the value should be set.
 * @param {string} value - The value to set in the row.
 */
function updateRow(rows, description, valueIndex, value) {
  const row = getOrCreateRow(rows, description, "");
  row[valueIndex] = value;
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
      const rows = [];

      // Gas details for Rust
      const gasDetails = {
        "Convert transaction to receipt":
          details.gasUsedToConvertTransactionToReceipt,
        "Execute the receipt (actual contract call)":
          details.gasUsedToExecuteReceipt,
      };

      Object.entries(gasDetails).forEach(([description, value]) => {
        if (value) {
          updateRow(rows, description, 1, value);
        }
      });

      // Breakdown metrics for Rust
      const breakdown = details.gasBreakdownForReceipt ?? details;
      Object.entries(breakdown).forEach(([metric, value]) => {
        updateRow(rows, metric, 1, value);
      });

      // Find JS entry and update rows with JS values
      const jsEntry = Object.entries(sortedJsonData).find(
        ([key]) => key.startsWith("JS") && key.includes(name.split("_")[1])
      );

      if (jsEntry) {
        const [, jsDetails] = jsEntry;

        const jsBreakdown = jsDetails.gasBreakdownForReceipt ?? jsDetails;
        Object.entries(jsBreakdown).forEach(([metric, value]) => {
          updateRow(rows, metric, 2, value);
        });

        // Update specific gas used values for JS
        updateRow(
          rows,
          "Convert transaction to receipt",
          2,
          jsDetails.gasUsedToConvertTransactionToReceipt
        );
        updateRow(
          rows,
          "Execute the receipt (actual contract call)",
          2,
          jsDetails.gasUsedToExecuteReceipt
        );
      }

      // Add remaining metrics
      rows.push(
        [
          "Gas used to refund unused gas",
          details.gasUsedToRefundUnusedGas,
          jsEntry ? jsEntry[1].gasUsedToRefundUnusedGas : "",
        ],
        [
          "Total gas used",
          details.totalGasUsed,
          jsEntry ? jsEntry[1].totalGasUsed : "",
        ]
      );

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

  const sortedData = order.reduce((acc, key) => {
    if (data[key]) {
      acc[key] = data[key];
    }
    return acc;
  }, {});

  return sortedData;
}

/**
 * Filters the markdownSections containing redundant data before including them in the markdown file.
 *
 * @param {Array} sections - The array of markdown sections data.
 * @returns {Array} - The filtered markdown sections data.
 */
function filterMarkdownSections(sections) {
  const rsBaseNames = new Set();
  const filteredSections = [];

  sections.forEach((section) => {
    const baseName = section.h3.replace(/^RS_/, "").replace(/^JS_/, "");

    if (section.h3.startsWith("RS_")) {
      rsBaseNames.add(baseName);
      filteredSections.push({ ...section, h3: baseName });
    } else if (section.h3.startsWith("JS_") && !rsBaseNames.has(baseName)) {
      filteredSections.push({ ...section, h3: baseName });
    }
  });

  return filteredSections;
}
