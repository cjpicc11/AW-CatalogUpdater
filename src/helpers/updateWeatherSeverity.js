import axios from "axios"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import logToFile from "../util/logger.js"
import { incrementApiCallCount } from "./incrementApiCallCount.js"

const AW_API_KEY = process.env.AW_API

async function getLocationData(zipCodes = []) {
  try {
    await dbConnect()
    const query = zipCodes.length ? { zipCode: { $in: zipCodes } } : {}
    const locations = await Location.find(query)
    console.log(locations)
    return locations
  } catch (error) {
    logToFile("ERROR:  Failed to read location data from database:", error)
    return []
  }
}

async function updateLocationSeverity(location) {
  const { zipCode, locationCode } = location
  console.log("INSIDE updateLocationSeverity")
  try {
    await incrementApiCallCount("AccuWeather")
    const response = await axios.get(`http://dataservice.accuweather.com/forecasts/v1/daily/1day/${locationCode}?apikey=${AW_API_KEY}`)

    const { Severity, EffectiveEpochDate, EndEpochDate } = response.data.Headline
    console.log("severity:  " + Severity)
    console.log("EffectiveEpochDate:  " + EffectiveEpochDate)
    console.log("EndEpochDate:  " + EndEpochDate)
    await Location.updateOne(
      { zipCode },
      {
        weatherSeverity: Severity,
        severityEffectiveEpochStart: EffectiveEpochDate,
        severityEffectiveEpochEnd: EndEpochDate,
      }
    )

    logToFile(`Updated severity for zip code ${zipCode}`)
  } catch (error) {
    logToFile(`ERROR:  fetching weather severity for location code ${locationCode}: ${error.response ? error.response.data : error.message}`)
  }
}

async function updateWeatherSeverity(zipCodes = []) {
  const locations = await getLocationData(zipCodes)

  for (const location of locations) {
    await updateLocationSeverity(location)
  }
}

export async function updateWeatherSeverityForAllZipCodes() {
  await updateWeatherSeverity()
}

export async function updateWeatherSeverityForSpecificZipCodes(zipCodes) {
  await updateWeatherSeverity(zipCodes)
}
