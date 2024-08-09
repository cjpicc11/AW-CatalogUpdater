import mongoose from "mongoose"
import axios from "axios"
import Location from "../models/Location" // Import the Location model
import Climo from "../models/Climo" // Import the Climo model
import logToFile from "../util/logger.js" // Import the logToFile function
import { incrementApiCallCount } from "./incrementApiCallCount.js"
import dbConnect from "../util/dbConnect.js"

const AW_API_KEY = process.env.AW_API
const AW_DOMAIN = process.env.AW_DOMAIN

const updateClimoData = async zipCodes => {
  try {
    await dbConnect()
    logToFile("Clearing the entire Climo collection!")
    // Always clear out the entire Climo collection first
    await Climo.deleteMany({})
    logToFile("Cleared the entire Climo collection.")

    // Fetch locations that match the provided zip codes or all locations if none are provided
    const locations = await Location.find(zipCodes && zipCodes.length > 0 ? { zipCode: { $in: zipCodes } } : {})

    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, "0") // Get the current month

    // Process each location concurrently
    await Promise.all(
      locations.map(async location => {
        try {
          // Log the zip code and location being processed
          logToFile(`Processing Climo data for zip code: ${location.zipCode}`)

          await incrementApiCallCount("AccuWeather-DEMO")

          const url = `https://${AW_DOMAIN}/climo/v1/normals/${year}/${month}/${location.locationCode}?apikey=${AW_API_KEY}`
          const response = await axios.get(url)

          const climoData = response.data

          // Prepare data for bulk insertion
          const climoDocuments = climoData.map(dayData => ({
            zipCode: location.zipCode,
            dateString: new Date(dayData.Date).toISOString().split("T")[0], // Get the date in YYYY-MM-DD format
            avgHigh: dayData.Normals.Temperatures.Maximum.Imperial.Value,
            avgLow: dayData.Normals.Temperatures.Minimum.Imperial.Value,
          }))

          // Insert all new Climo documents
          await Climo.insertMany(climoDocuments)

          logToFile(`Successfully updated Climo data for zip code: ${location.zipCode} for month: ${year}-${month}`)
        } catch (locationError) {
          logToFile(`Error processing location ${location.zipCode}: ${locationError.message}`)
        }
      })
    )

    logToFile("Climo data processed successfully.")
  } catch (error) {
    logToFile(`Error processing Climo data: ${error.message}`)
  }
}

export default updateClimoData
