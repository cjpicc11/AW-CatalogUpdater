import axios from "axios"
import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import logToFile from "../util/logger.js"
import { incrementApiCallCount } from "./incrementApiCallCount.js"

const AW_API_KEY = process.env.AW_API
const AW_DOMAIN = process.env.AW_DOMAIN

const ALLOWED_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Indiana/Indianapolis",
]

async function updateLocationData(zipCodes = []) {
  try {
    await dbConnect()
    logToFile("Connected to database.")

    // Fetch locations: if zip codes are provided, filter by them and time zones; otherwise, fetch all locations with allowed time zones
    const query =
      zipCodes.length > 0 ? { zipCode: { $in: zipCodes }, timeZone: { $in: ALLOWED_TIMEZONES } } : { timeZone: { $in: ALLOWED_TIMEZONES } }

    const locations = await Location.find(query)

    // Process each location asynchronously
    await Promise.all(
      locations.map(async location => {
        try {
          await incrementApiCallCount("AccuWeather-DEMO")

          // Fetch the location code and time zone from the AccuWeather API
          const response = await axios.get(`https://${AW_DOMAIN}/locations/v1/postalcodes/search?apikey=${AW_API_KEY}&q=${location.zipCode}`)
          const locationCode = response.data[0].Key
          const timeZone = response.data[0].TimeZone.Name

          // Update the Location model with the fetched location code and time zone
          await Location.findOneAndUpdate({ zipCode: location.zipCode }, { locationCode, timeZone }, { new: true })

          logToFile(`Updated location for zip code ${location.zipCode} with location code ${locationCode} and time zone ${timeZone}`)
        } catch (error) {
          logToFile(`Error fetching location code for zip code ${location.zipCode}: ${error.message}`)
        }
      })
    )

    logToFile(zipCodes.length > 0 ? "Specific zip codes updated successfully." : "All zip codes updated successfully.")
  } catch (error) {
    logToFile(`Error updating location data: ${error.message}`)
  }
}

export default updateLocationData
