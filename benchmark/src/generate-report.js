import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { jsonToMarkdown } from "../__tests__/util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonFilePath = path.resolve(
  __dirname,
  "..",
  "temp-all-test-results.json"
);

async function generateReport() {
  try {
    const jsonData = JSON.parse(await fs.readFile(jsonFilePath, "utf-8"));

    await jsonToMarkdown(
      "Tests Gas Consumption Comparison",
      jsonData,
      "TESTS-GAS-CONSUMPTION-COMPARISON"
    );

    await fs.unlink(jsonFilePath);
    console.log("Report generated and JSON file deleted successfully.");
  } catch (error) {
    console.error("Error generating report:", error);
    process.exit(1);
  }
}

generateReport();
