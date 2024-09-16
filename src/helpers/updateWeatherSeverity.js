import axios from "axios"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import logToFile from "../util/logger.js"
import { incrementApiCallCount } from "./incrementApiCallCount.js"
import { ALLOWED_TIMEZONES } from "../util/constants.js" // Import the allowed time zones

const AW_API_KEY = process.env.AW_API
const AW_DOMAIN = process.env.AW_DOMAIN
const AW_API_DESC = process.env.AW_API_DESC

async function getLocationData(zipCodes = []) {
  try {
    await dbConnect()

    // Build the query based on provided zip codes, allowed time zones, and storeZipCode = true
    const query = zipCodes.length
      ? { zipCode: { $in: zipCodes }, timeZone: { $in: ALLOWED_TIMEZONES }, storeZipCode: true }
      : { timeZone: { $in: ALLOWED_TIMEZONES }, storeZipCode: true }

    const locations = await Location.find(query)
    return locations
  } catch (error) {
    logToFile("ERROR: Failed to read location data from database:", error)
    return []
  }
}

async function updateLocationSeverity(location) {
  const { zipCode, locationCode } = location

  // Skip locations where locationCode is "NULL"
  if (locationCode === "NULL") {
    logToFile(`Skipping location with zip code ${zipCode} as locationCode is "NULL"`)
    return
  }

  try {
    await incrementApiCallCount(AW_API_DESC)
    const response = await axios.get(`https://${AW_DOMAIN}/forecasts/v1/daily/1day/${locationCode}?apikey=${AW_API_KEY}`)

    const { Severity, EffectiveEpochDate, EndEpochDate } = response.data.Headline

    await Location.updateOne(
      { zipCode },
      {
        weatherSeverity: Severity,
        severityEffectiveEpochStart: EffectiveEpochDate,
        severityEffectiveEpochEnd: EndEpochDate,
      }
    )
    //logToFile(`Weather severity updated for zip code ${zipCode}`)
  } catch (error) {
    const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    logToFile(`ERROR: fetching weather severity for location code ${locationCode}: ${errorDetails}`)
  }
}

async function updateWeatherSeverity(zipCodes = []) {
  logToFile(`Getting Locations to update...`)
  const locations = await getLocationData(zipCodes)

  // Log the count of valid locations (excluding those with locationCode "NULL")
  const validLocations = locations.filter(loc => loc.locationCode !== "NULL")
  logToFile(`Found ${validLocations.length} valid locations to update weather severity.`)

  logToFile(`Processing Weather Severity for Locations...`)
  // Run updates asynchronously for all valid locations
  await Promise.all(validLocations.map(updateLocationSeverity))
  logToFile(`Weather Severity for Locations complete!!!`)
}

export async function updateWeatherSeverityForAllZipCodes() {
  await updateWeatherSeverity()
}

export async function updateWeatherSeverityForSpecificZipCodes(zipCodes) {
  await updateWeatherSeverity(zipCodes)
}
