import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js/index.js"

// Convert file URL to path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Function to read and parse the data file
const readAndParseFile = filePath => {
  const data = fs.readFileSync(filePath, "utf8")
  const entries = data.split(",")
  const parsedData = entries.map(entry => {
    const [zipCode, locationCode, timeZone] = entry.split(":")
    return { zipCode: zipCode, locationCode, timeZone }
  })
  return parsedData
}

// Main function to populate the database
const main = async () => {
  try {
    const filePath = path.join(__dirname, "locationCodes.txt")
    console.log(`Reading data from: ${filePath}`)

    const locations = readAndParseFile(filePath)
    console.log(`Parsed ${locations.length} locations`)

    // Connect to MongoDB using the dbConnect utility
    await dbConnect()

    // Insert data into MongoDB
    await Location.insertMany(locations)
    console.log("Data has been saved to MongoDB")

    // Disconnect from MongoDB
    await mongoose.disconnect()
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }
}

main().catch(err => console.error(err))
