import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js" // Import the Location model
import logToFile from "../util/logger.js" // Import the logToFile function

const setStoreZipCodeToFalse = async () => {
  try {
    await dbConnect()

    // Update all documents in the Location collection to set storeZipCode to false
    const result = await Location.updateMany({}, { storeZipCode: false })

    logToFile(`Successfully updated ${result.modifiedCount} locations, setting storeZipCode to false.`)
  } catch (error) {
    logToFile(`Error updating locations: ${error.message}`)
  }
}

export default setStoreZipCodeToFalse
