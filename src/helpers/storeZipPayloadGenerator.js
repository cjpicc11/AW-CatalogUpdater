import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Get the current directory of the script
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function readZipCodes(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8")
    const zipCodes = data
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "")
    return zipCodes
  } catch (err) {
    console.error("Error reading the file:", err)
    return []
  }
}

function writeZipCodesAsArray(zipCodes, outputFilePath) {
  const arrayString = `["${zipCodes.join('","')}"]`
  try {
    fs.writeFileSync(outputFilePath, arrayString, "utf8")
    console.log("Zip codes written to file successfully!")
  } catch (err) {
    console.error("Error writing to the file:", err)
  }
}

// Define the input and output file paths
const inputFilePath = path.join(__dirname, "storeZips.txt") // Change 'zipcodes.txt' to your input file name
const outputFilePath = path.join(__dirname, "zipcodesArray.txt") // Output file name

// Read zip codes and write them to a new file in array string format
const zipCodes = readZipCodes(inputFilePath)
writeZipCodesAsArray(zipCodes, outputFilePath)
