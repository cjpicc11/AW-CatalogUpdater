import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Climo from "../models/Climo.js"

// Function to search for a document by zipCode and dateString
const searchClimoData = async (zipCode, dateString) => {
  try {
    // Connect to MongoDB using the dbConnect utility
    await dbConnect()

    // Search for the document
    const result = await Climo.findOne({ zipCode, dateString })
    if (result) {
      console.log("Data found:", result)
    } else {
      console.log("Data not found for zipCode:", zipCode, "and dateString:", dateString)
    }

    // Disconnect from MongoDB
    await mongoose.disconnect()
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }
}

// Get the zipCode and dateString to search for from command line arguments
const zipCode = process.argv[2]
const dateString = process.argv[3]
if (!zipCode || !dateString) {
  console.error("Please provide both zipCode and dateString to search for.")
  process.exit(1)
}

// Run the search
searchClimoData(zipCode, dateString).catch(err => console.error(err))
