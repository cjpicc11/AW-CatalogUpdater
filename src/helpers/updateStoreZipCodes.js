import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js" // Import the Location model
import logToFile from "../util/logger.js" // Import the logToFile function

const updateStoreZipCodes = async zipCodes => {
  try {
    await dbConnect()

    if (!zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
      throw new Error("zipCodes must be a non-empty array.")
    }

    // Process each zip code asynchronously
    const updatePromises = zipCodes.map(async zipCode => {
      try {
        const existingLocation = await Location.findOne({ zipCode })

        if (existingLocation) {
          // Update the storeZipCode field to true if the location already exists
          existingLocation.storeZipCode = true
          await existingLocation.save()

          logToFile(`Updated existing location for zip code ${zipCode}, setting storeZipCode to true.`)
        } else {
          // Insert a new location with storeZipCode = true and timeZone = "null"
          await Location.create({
            zipCode,
            timeZone: "null",
            storeZipCode: true,
          })

          logToFile(`Inserted new location for zip code ${zipCode} with storeZipCode = true and timeZone = "null".`)
        }
      } catch (error) {
        logToFile(`Error processing zip code ${zipCode}: ${error.message}`)
      }
    })

    // Wait for all the zip codes to be processed
    await Promise.all(updatePromises)

    logToFile(`Successfully processed ${zipCodes.length} zip codes.`)
  } catch (error) {
    logToFile(`Error updating or inserting locations: ${error.message}`)
    throw error
  }
}

export default updateStoreZipCodes
