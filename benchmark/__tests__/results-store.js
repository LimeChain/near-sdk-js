import fs from "fs";
import path from "path";

const resultsFilePath = path.resolve("temp-all-test-results.json");

function readExistingResults() {
  if (fs.existsSync(resultsFilePath)) {
    const fileContent = fs.readFileSync(resultsFilePath, "utf-8");
    return JSON.parse(fileContent);
  }
  return {};
}

export function saveResults(newResults) {
  const existingResults = readExistingResults();
  const combinedResults = { ...existingResults, ...newResults };
  fs.writeFileSync(resultsFilePath, JSON.stringify(combinedResults, null, 2));
}

export function addTestResults(testName, result) {
  if (process.env.GENERATE_REPORT === "true") {
    const tempResults = {};
    tempResults[testName] = result;

    saveResults(tempResults);
  }
}
