import axios from "axios"
import { DateTime } from "luxon"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import Climo from "../models/Climo.js"
import logToFile from "../util/logger.js"
import { incrementApiCallCount } from "./incrementApiCallCount.js"
import { ALLOWED_TIMEZONES, rainPhrases, snowPhrases } from "@/util/constants.js"

const AW_API_KEY = process.env.AW_API
const AW_DOMAIN = process.env.AW_DOMAIN
const BRAZE_API_KEY = process.env.BRAZE_API
const BRAZE_API_DOMAIN = process.env.BRAZE_API_DOMAIN
const AW_API_DESC = process.env.AW_API_DESC
const CATALOG_NAME = process.env.DAILY_FORECAST_CATALOG_NAME
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds
const batchSize = 50
const delayBetweenRequests = 0 // Define the delayBetweenRequests here
let zipCodesProcessed = 0

async function getLocationData(zipCodes = []) {
  try {
    await dbConnect()

    // Build the query based on provided zip codes, allowed time zones, and storeZipCode = true
    const query = zipCodes.length
      ? { zipCode: { $in: zipCodes }, timeZone: { $in: ALLOWED_TIMEZONES }, storeZipCode: true }
      : { timeZone: { $in: ALLOWED_TIMEZONES }, storeZipCode: true }

    const locations = await Location.find(query)

    // Log the total valid location codes to be updated
    logToFile(`Total valid location codes to be updated: ${locations.length}`)

    // Log each location's zipCode, storeZipCode value, and timeZone value
    // DEBUGGING ONLY
    // locations.forEach(location => {
    //   logToFile(`Processing location - Zip Code: ${location.zipCode}, Store Zip Code: ${location.storeZipCode}, Time Zone: ${location.timeZone}`)
    // })

    return locations.reduce((acc, { zipCode, locationCode, timeZone, weatherSeverity, severityEffectiveEpochStart, severityEffectiveEpochEnd }) => {
      acc[zipCode] = {
        locationCode,
        timeZone,
        weatherSeverity,
        severityEffectiveEpochStart,
        severityEffectiveEpochEnd,
      }
      return acc
    }, {})
  } catch (error) {
    logToFile("Failed to read location data from database:", error)
    throw new Error(`Problem reading data from DB: ${error}`)
  }
}

async function getClimoData(zipCode, date) {
  try {
    const climoData = await Climo.findOne({ zipCode, dateString: date })
    if (!climoData) {
      throw new Error(`No climate data found for zip code ${zipCode} on date ${date}`)
    }
    return climoData
  } catch (error) {
    logToFile(`Failed to read climate data for zip code ${zipCode}: ${error.message}`)
    return null
  }
}

async function filterByTime(locationData, utcNow) {
  return Object.entries(locationData)
    .filter(([zipCode, { timeZone }]) => {
      const localTime = utcNow.setZone(timeZone)
      return localTime.hour >= 6 && localTime.hour <= 18
    })
    .reduce((acc, [zipCode, data]) => {
      const localTime = utcNow.setZone(data.timeZone)
      if (localTime.hour >= 6 && localTime.hour <= 11) {
        acc[zipCode] = { ...data, timeOfDay: "Breakfast" }
      } else {
        acc[zipCode] = { ...data, timeOfDay: "LunchOrDinner" }
      }
      return acc
    }, {})
}

const fetchWithRetry = async (url, locationCode, retries = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url)
      return response
    } catch (error) {
      if (attempt === retries || (error.response && error.response.status !== 504)) {
        logToFile(`ERROR: Failed to fetch data for location code ${locationCode} with status ${error.response?.status || error.message}`)
        throw error
      }
      logToFile(`WARNING: Request for location code ${locationCode} failed with 504. Retrying attempt ${attempt} of ${retries}...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }
}

async function processBatch(batch, validLocationData, utcNow, batchNumber) {
  const catalogItems = await Promise.all(
    batch.map(async zipCode => {
      const { locationCode, timeOfDay, weatherSeverity, severityEffectiveEpochStart, severityEffectiveEpochEnd } = validLocationData[zipCode]

      try {
        const currentDate = utcNow.setZone(validLocationData[zipCode].timeZone).toISO().split("T")[0]
        const currentDateCatalog = utcNow.setZone(validLocationData[zipCode].timeZone).toISO()
        const currentDateString = utcNow.setZone(validLocationData[zipCode].timeZone).toFormat("yyyy-MM-dd")

        await incrementApiCallCount(AW_API_DESC)

        const url = `http://${AW_DOMAIN}/forecasts/v1/hourly/1hour/${locationCode}?apikey=${AW_API_KEY}`
        const response = await fetchWithRetry(url, locationCode)

        if (!response.data || !response.data[0]) {
          logToFile(`WARNING: No weather data returned for location code ${locationCode}`)
          return null
        }

        const { IconPhrase, Temperature, PrecipitationProbability } = response.data[0]
        const currentTemp = Temperature.Value

        const climoData = await getClimoData(zipCode, currentDate)
        if (!climoData) {
          return null
        }

        const { avgHigh, avgLow } = climoData
        let unseasonable = "None"

        if (currentTemp > avgHigh + 15) {
          unseasonable = "Hot"
        } else if (currentTemp < avgLow - 15) {
          unseasonable = "Cold"
        }

        let weather = IconPhrase + "_AW"
        if (PrecipitationProbability >= 70) {
          if (rainPhrases.includes(IconPhrase)) {
            weather = "Rain"
          } else if (snowPhrases.includes(IconPhrase)) {
            weather = "Snow"
          }
        }

        let weatherSafety = "Safe"
        const epochNow = DateTime.now().setZone(validLocationData[zipCode].timeZone).toSeconds()
        if (weatherSeverity === 1 && epochNow >= severityEffectiveEpochStart && epochNow <= severityEffectiveEpochEnd) {
          weatherSafety = "Dangerous"
        }

        return {
          id: zipCode,
          zipCode,
          weather,
          temp: currentTemp,
          updateDateTime: currentDateCatalog,
          updateDateString: currentDateString,
          precipitationChance: PrecipitationProbability,
          timeOfDay,
          unseasonable,
          weatherSafety,
          batch: batchNumber,
        }
      } catch (error) {
        logToFile(`Error fetching weather for location code ${locationCode}: ${error.response ? error.response.data : error.message}`)
        return null
      }
    })
  )

  return catalogItems.filter(item => item !== null) // Remove any null results
}

async function updateWeather(zipCodes = [], batch = 1) {
  const utcNow = DateTime.utc()

  const allLocationData = await getLocationData(zipCodes)
  const validLocationData = await filterByTime(allLocationData, utcNow)

  const zipCodesToProcess = Object.keys(validLocationData)
  logToFile(`Processing ${zipCodesToProcess.length} Locations for Weather Data in Batch ${batch}...`)

  for (let i = 0; i < zipCodesToProcess.length; i += batchSize) {
    const batchZipCodes = zipCodesToProcess.slice(i, i + batchSize)

    const catalogItems = await processBatch(batchZipCodes, validLocationData, utcNow, batch)

    try {
      await axios.patch(
        `https://${BRAZE_API_DOMAIN}/catalogs/${CATALOG_NAME}/items`,
        { items: catalogItems }, // Include the batch parameter in the Braze API request
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${BRAZE_API_KEY}`,
          },
        }
      )

      zipCodesProcessed += catalogItems.length

      if (zipCodesProcessed % 1000 === 0) {
        logToFile(`Processed ${zipCodesProcessed} zip codes in batch ${batch}`)
      }

      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests * 1000)) // Convert seconds to milliseconds
    } catch (error) {
      const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      logToFile(`Error updating catalog in batch ${batch}: ${errorDetails}`)
    }
  }

  logToFile(`Total processed items in batch ${batch}: ${zipCodesProcessed}`)
}

export async function updateWeatherForAllZipCodes(batch) {
  await updateWeather([], batch)
}

export async function updateWeatherForSpecificZipCodes(zipCodes, batch) {
  await updateWeather(zipCodes, batch)
}
