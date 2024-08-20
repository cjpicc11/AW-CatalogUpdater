import mongoose from "mongoose"
import axios from "axios"
import Location from "../models/Location" // Import the Location model
import Climo from "../models/Climo" // Import the Climo model
import logToFile from "../util/logger.js" // Import the logToFile function
import { incrementApiCallCount } from "./incrementApiCallCount.js"
import dbConnect from "../util/dbConnect.js"
import { ALLOWED_TIMEZONES } from "../util/constants.js" // Import the allowed time zones

const AW_API_KEY = process.env.AW_API
const AW_DOMAIN = process.env.AW_DOMAIN
const AW_API_DESC = process.env.AW_API_DESC // Import the API description from environment variables
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

const fetchWithRetry = async (url, locationCode, retries = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url)
      return response // If successful, return the response
    } catch (error) {
      if (attempt === retries || (error.response && error.response.status !== 504)) {
        // If the maximum number of retries is reached, or the error is not a 504, log the error and rethrow it
        logToFile(`ERROR: Failed to fetch data for location code ${locationCode} with status ${error.response?.status || error.message}`)
        throw error
      }
      logToFile(`WARNING: Request for location code ${locationCode} failed with 504. Retrying attempt ${attempt} of ${retries}...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY)) // Wait before retrying
    }
  }
}

const updateClimoData = async (zipCodes = [], yearMonth) => {
  try {
    await dbConnect()

    // Extract year and month from the passed yyyy-mm string
    const [year, month] = yearMonth.split("-")
    if (!year || !month || year.length !== 4 || month.length !== 2) {
      throw new Error("Invalid yearMonth format. It should be in 'yyyy-mm' format.")
    }

    logToFile(`Clearing Climo data for year ${year} and month ${month}.`)

    // Build the delete query based on whether specific zip codes are provided
    const deleteQuery =
      zipCodes.length > 0
        ? { zipCode: { $in: zipCodes }, dateString: { $regex: `^${year}-${month}-` } }
        : { dateString: { $regex: `^${year}-${month}-` } }

    // Delete Climo data for the specified year, month, and optionally zip codes
    await Climo.deleteMany(deleteQuery)
    logToFile(`Cleared Climo data for year ${year} and month ${month}${zipCodes.length ? ` for zip codes ${zipCodes.join(", ")}` : ""}.`)

    // Build the query to filter locations by zip codes, allowed time zones, and storeZipCode = true
    const query =
      zipCodes.length > 0
        ? { zipCode: { $in: zipCodes }, timeZone: { $in: ALLOWED_TIMEZONES }, storeZipCode: true }
        : { timeZone: { $in: ALLOWED_TIMEZONES }, storeZipCode: true }

    // Fetch locations that match the query
    const locations = await Location.find(query)

    // Log the total count of valid locations
    logToFile(`Total valid locations to get CLimo Data for: ${locations.length}`)
    logToFile(`Processing Climo Data updates...`)

    // Process each location concurrently
    await Promise.all(
      locations.map(async location => {
        try {
          // Use the AW_API_DESC environment variable in the incrementApiCallCount function
          await incrementApiCallCount(AW_API_DESC)

          const url = `https://${AW_DOMAIN}/climo/v1/normals/${year}/${month}/${location.locationCode}?apikey=${AW_API_KEY}`
          const response = await fetchWithRetry(url, location.locationCode)

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
