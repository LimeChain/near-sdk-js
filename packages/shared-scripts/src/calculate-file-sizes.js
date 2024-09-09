import fs from "fs/promises";
import path from "path";
import json2md from "json2md";

// Get directory and flags from command line arguments
const args = process.argv.slice(2);
const relativeDir = args[0];
const isBefore = args.includes("--before");
const isAfter = args.includes("--after");

if (!relativeDir) {
  console.log("Please provide a directory path as an argument.");
  process.exit(1);
}

if (!isBefore && !isAfter) {
  console.log("Please specify either --before or --after flag.");
  process.exit(1);
}

// Get the working directory from the environment variable
const scriptDir = process.env.WORKING_DIR || process.cwd();
const dir = path.resolve(scriptDir, relativeDir);
const jsonFilePath = path.join(scriptDir, "file-sizes.json");

const calculateFileSizes = async () => {
  try {
    // Check if the directory exists
    await fs.access(dir);

    const files = await fs.readdir(dir);
    let fileSizes = { beforeOptimization: {}, afterOptimization: {} };

    // Check if the JSON file already exists and load data
    if (
      await fs
        .stat(jsonFilePath)
        .then(() => true)
        .catch(() => false)
    ) {
      const data = await fs.readFile(jsonFilePath, "utf-8");
      fileSizes = JSON.parse(data);
    }

    // If the --after flag is used, ensure beforeOptimization data exists
    if (isAfter && Object.keys(fileSizes.beforeOptimization).length === 0) {
      console.log(
        "No data found before optimization. Please run the script with --before first."
      );
      process.exit(1);
    }

    // Filter .wasm files and calculate sizes
    const wasmFiles = files.filter((file) => path.extname(file) === ".wasm");

    const fileSizePromises = wasmFiles.map(async (file) => {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      const fileSizeInKB = (stats.size / 1024).toFixed(2);

      // Add file size to the appropriate section
      if (isBefore) {
        fileSizes.beforeOptimization[file] = `${fileSizeInKB} KB`;
      } else if (isAfter) {
        fileSizes.afterOptimization[file] = `${fileSizeInKB} KB`;
      }
    });

    // Wait for all file size calculations to complete
    await Promise.all(fileSizePromises);

    // Write the result to the JSON file
    await fs.writeFile(jsonFilePath, JSON.stringify(fileSizes, null, 2));
    console.log(`File sizes saved to ${jsonFilePath}`);

    const updatedData = await fs.readFile(jsonFilePath, "utf-8");
    const updatedFileSizes = JSON.parse(updatedData);

    if (
      Object.keys(updatedFileSizes.beforeOptimization).length &&
      Object.keys(updatedFileSizes.afterOptimization).length
    ) {
      // Generate Markdown file
      generateMarkdown(scriptDir, fileSizes);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};

// Function to generate the Markdown file
const generateMarkdown = async (outputDir, data) => {
  const folderName = path.basename(outputDir).toUpperCase();

  const mdContent = {
    h1: `NEAR-SDK-JS ${folderName}`,
    h3: "WASM File Size Comparison Before and After Optimization",
    table: {
      headers: ["File Name", "Before Opt (KB)", "After Opt (KB)", "% Diff"],
      rows: Object.keys(data.beforeOptimization).map((file) => {
        const beforeSize = data.beforeOptimization[file];
        const afterSize = data.afterOptimization[file] || "N/A";
        return [
          file,
          beforeSize,
          afterSize,
          afterSize !== "N/A"
            ? calculatePercentageDifference(beforeSize, afterSize)
            : "N/A",
        ];
      }),
    },
  };

  // Convert JSON to markdown
  const markdown = json2md(mdContent);

  // Write markdown to a file
  const filePath = path.join(outputDir, "WASM-FILE-SIZE-COMPARISON.md");
  await fs.writeFile(filePath, markdown);

  console.log(`Markdown file has been saved to ${filePath}`);
  await fs.unlink(path.join(outputDir, "file-sizes.json"));
};

// Function to calculate percentage difference
const calculatePercentageDifference = (beforeSize, afterSize) => {
  const beforeSizeNum = parseFloat(beforeSize);
  const afterSizeNum = parseFloat(afterSize);
  return (
    (((beforeSizeNum - afterSizeNum) / beforeSizeNum) * 100).toFixed(2) + "%"
  );
};

calculateFileSizes();
