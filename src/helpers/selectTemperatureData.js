import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Function to load the index from a file
const loadIndex = filePath => {
  const data = fs.readFileSync(filePath, "utf8")
  return JSON.parse(data)
}

// Convert file URL to path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the index file
const indexFilePath = path.join(__dirname, "climoDataIndex.json")

// Load the index from the file
const dataIndex = loadIndex(indexFilePath)

// Function to query the data using the in-memory index
const queryData = (index, id) => {
  return index[id] || null
}

// Function to run the search
const runSearch = id => {
  const result = queryData(dataIndex, id)
  if (result) {
    console.log("Data found:", result)
  } else {
    console.log("Data not found for ID:", id)
  }
}

// Get the ID to search for from command line arguments
const idToSearch = process.argv[2]
if (!idToSearch) {
  console.error("Please provide an ID to search for.")
  process.exit(1)
}

// Run the search
runSearch(idToSearch)
