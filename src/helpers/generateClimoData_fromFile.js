import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Climo from "../models/Climo.js"

// Convert file URL to path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Function to generate a unique ID by concatenating zipCode and date
const generateUniqueId = (zipCode, date) => {
  return `${zipCode}_${date}`
}

// Function to get the number of days in the current month
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate()
}

// Function to generate temperature data for the current month
const generateTemperatureData = zipCode => {
  const data = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = getDaysInMonth(year, month)

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i).toISOString().split("T")[0] // Format date as yyyy-mm-dd
    const avgLow = Math.floor(Math.random() * 20 + 60) // Random low temp between 60 and 80
    const avgHigh = Math.floor(Math.random() * 20 + 80) // Random high temp between 80 and 100

    data.push({
      zipCode,
      dateString: date,
      avgLow,
      avgHigh,
    })
  }

  return data
}

// Main function to populate the database
export const generateClimoData = async () => {
  try {
    const zipCodeFilePath = path.join(__dirname, "locationCodes.txt")
    console.log(`Reading zip codes from: ${zipCodeFilePath}`)

    const fileContent = fs.readFileSync(zipCodeFilePath, "utf-8")
    console.log(`File content: ${fileContent}`)

    const zipCodes = fileContent.split(",")
    console.log(`Parsed zip codes: ${zipCodes.length}`)

    let allData = []

    for (const zipCodeInfo of zipCodes) {
      if (zipCodeInfo.trim() === "") continue // Skip empty entries
      const [zipCode] = zipCodeInfo.split(":")
      console.log(`Processing zip code: ${zipCode}`)

      const data = generateTemperatureData(zipCode)
      allData = allData.concat(data)
    }

    console.log(`Total records to save: ${allData.length}`)

    // Connect to MongoDB using the dbConnect utility
    await dbConnect()

    // Clear the Climo collection before inserting new data
    await Climo.deleteMany({})
    console.log("Cleared the Climo collection")

    // Insert new data into MongoDB
    await Climo.insertMany(allData)
    console.log("Data has been saved to MongoDB")

    // Disconnect from MongoDB
    await mongoose.disconnect()
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }
}

// If you want to call the function from the same file
// populateDatabase().catch(err => console.error(err));
