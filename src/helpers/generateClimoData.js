import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Climo from "../models/Climo.js"
import Location from "../models/Location.js" // Updated to use the Location model
import logToFile from "../util/logger.js" // Import the logToFile function

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
    // Connect to MongoDB using the dbConnect utility
    await dbConnect()

    // Fetch zip codes from the Location collection
    const locations = await Location.find().select("zipCode -_id")
    const zipCodes = locations.map(location => location.zipCode)
    logToFile(`Fetched zip codes: ${zipCodes.length}`)

    logToFile("Processing Zip Codes for Climo Generation...")
    // Process zip codes in parallel
    const allDataPromises = zipCodes.map(zipCode => {
      return new Promise(resolve => {
        const data = generateTemperatureData(zipCode)
        resolve(data)
      })
    })

    // Wait for all promises to resolve
    const allDataArrays = await Promise.all(allDataPromises)

    // Flatten the array of arrays into a single array
    const allData = [].concat(...allDataArrays)

    logToFile(`Total records to save: ${allData.length}`)

    // Clear the Climo collection before inserting new data
    await Climo.deleteMany({})
    logToFile("Cleared the Climo collection")

    logToFile("Saving Data to DB...")
    // Insert new data into MongoDB
    await Climo.insertMany(allData)
    logToFile("Data has been saved to DB.")

    // Disconnect from MongoDB
    await mongoose.disconnect()
  } catch (error) {
    logToFile(`Error: ${error.message}`)
  }
}

// If you want to call the function from the same file
// generateClimoData().catch(err => logToFile(err));
