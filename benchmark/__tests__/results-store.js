import fs from "fs";
import path from "path";

const resultsFilePath = path.resolve("temp-all-test-results.json");

/**
 * Reads existing test results from a JSON file if it exists.
 *
 * This function checks if the file specified by `resultsFilePath` exists.
 * If the file is found, it reads the file's content and parses it as JSON.
 * If the file does not exist, it returns an empty object.
 *
 * @returns {Object} The parsed JSON object from the file, or an empty object if the file does not exist.
 */
function readExistingResults() {
  if (fs.existsSync(resultsFilePath)) {
    const fileContent = fs.readFileSync(resultsFilePath, "utf-8");
    return JSON.parse(fileContent);
  }
  return {};
}

/** Function to add test results to the report if the GENERATE_REPORT environment variable is set to "true" */
export function addTestResults(testName, result) {
  // Check if we need to generate a report
  if (process.env.GENERATE_REPORT === "true") {
    // Create a temporary object for the new test results
    const tempResults = {
      [testName]: result,
    };

    // Read existing results from the file
    const existingResults = readExistingResults();

    // Combine existing results with new test results
    const combinedResults = {
      ...existingResults,
      ...tempResults,
    };

    // Write the combined results to the file
    fs.writeFileSync(resultsFilePath, JSON.stringify(combinedResults, null, 2));
  }
}
