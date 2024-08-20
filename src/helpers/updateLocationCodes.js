import axios from "axios"
import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import logToFile from "../util/logger.js"
import { incrementApiCallCount } from "./incrementApiCallCount.js"
import { ALLOWED_TIMEZONES_LOC } from "../util/constants.js"

const AW_API_KEY = process.env.AW_API
const AW_DOMAIN = process.env.AW_DOMAIN
const AW_API_DESC = process.env.AW_API_DESC

async function updateLocationData(zipCodes = []) {
  try {
    await dbConnect()

    // Additional logging to debug the issue
    logToFile(`Processing ${zipCodes.length > 0 ? "specific" : "all"} zip codes.`)

    // Fetch locations: if zip codes are provided, filter by them, time zones in ALLOWED_TIMEZONES_LOC, and storeZipCode = true
    const query = zipCodes.length > 0 ? { zipCode: { $in: zipCodes }, storeZipCode: true } : { storeZipCode: true }

    const locations = await Location.find(query)
    logToFile(`Found ${locations.length} location codes matching the query.`)

    // Check if no locations found
    if (locations.length === 0) {
      logToFile("No matching locations found with the provided query.")
      return
    }
    logToFile(`Updating Location Data...`)
    // Process each location asynchronously
    const updatePromises = locations.map(async location => {
      try {
        await incrementApiCallCount(AW_API_DESC)

        // Fetch the location code and time zone from the AccuWeather API
        const response = await axios.get(`https://${AW_DOMAIN}/locations/v1/postalcodes/US/search?apikey=${AW_API_KEY}&q=${location.zipCode}`)

        if (response.data.length === 0) {
          // Update the time zone to "NULL" if no data is returned
          await Location.findOneAndUpdate({ zipCode: location.zipCode }, { timeZone: "NULL" }, { new: true })
          logToFile(`No location data returned for zip code ${location.zipCode}. Time zone set to "NULL".`)
          return
        }

        const locationCode = response.data[0].Key
        const timeZone = response.data[0].TimeZone.Name

        // Update the Location model with the fetched location code and time zone
        await Location.findOneAndUpdate({ zipCode: location.zipCode }, { locationCode, timeZone }, { new: true })

        //logToFile(`Updated location for zip code ${location.zipCode} with location code ${locationCode} and time zone ${timeZone}`)
      } catch (error) {
        const responseCode = error.response ? error.response.status : "Unknown"
        logToFile(`Error fetching location code for zip code ${location.zipCode}. Response code: ${responseCode}, Error message: ${error.message}`)
      }
    })

    // Wait for all updates to complete
    await Promise.all(updatePromises)

    logToFile(zipCodes.length > 0 ? "Specific zip codes updated successfully." : "All zip codes updated successfully.")
  } catch (error) {
    logToFile(`Error updating location data: ${error.message}`)
  }
}

export default updateLocationData
