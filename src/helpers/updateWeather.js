import axios from "axios"
import { DateTime } from "luxon"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import Climo from "../models/Climo.js"
import logToFile from "../util/logger.js"
import { incrementApiCallCount } from "./incrementApiCallCount.js"

const AW_API_KEY = process.env.AW_API
const BRAZE_API_KEY = process.env.BRAZE_API
const CATALOG_NAME = process.env.DAILY_FORECAST_CATALOG_NAME
const delayBetweenRequests = 0
const batchSize = 50
let zipCodesProcessed = 0

const rainPhrases = [
  "Rain",
  "Thunderstorms",
  "Mostly Cloudy w/ T-Storms",
  "Mostly Cloudy w/ Showers",
  "Partly Sunny w/ T-Storms",
  "Partly Cloudy w/ Showers",
  "Mostly Cloudy w/ Showers",
  "Partly Cloudy w/ T-Storms",
]

const snowPhrases = [
  "Snow",
  "Mostly Cloudy w/ Snow",
  "Ice",
  "Sleet",
  "Freezing Rain",
  "Rain and Snow",
  "Flurries",
  "Mostly Cloudy w/ Flurries",
  "Partly Sunny w/ Flurries",
  "Mostly Cloudy w/ Flurries",
]

async function getLocationData(zipCodes = []) {
  try {
    await dbConnect()
    const query = zipCodes.length ? { zipCode: { $in: zipCodes } } : {}
    const locations = await Location.find(query)
    return locations.reduce((acc, { zipCode, locationCode, timeZone, weatherSeverity, severityEffectiveEpochStart, severityEffectiveEpochEnd }) => {
      acc[zipCode] = { locationCode, timeZone, weatherSeverity, severityEffectiveEpochStart, severityEffectiveEpochEnd }
      return acc
    }, {})
  } catch (error) {
    logToFile("Failed to read location data from database:", error)
    throw new Error(`Problem reading data from DB:  ${error}`)
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
    .filter(([zipCode, { timeZone, weatherSeverity, severityEffectiveEpochStart, severityEffectiveEpochEnd }]) => {
      const localTime = utcNow.setZone(timeZone)
      const epochNow = localTime.toSeconds()

      const isValidTime = localTime.hour >= 6 && localTime.hour <= 18

      if (isValidTime) {
        console.log("Zip Code:  " + zipCode + " Hour:  " + localTime.hour)
      }

      return isValidTime // Include all valid time records
    })
    .reduce((acc, [zipCode, data]) => {
      const localTime = utcNow.setZone(data.timeZone)
      if (localTime.hour >= 6 && localTime.hour <= 11) {
        acc[zipCode] = { ...data, timeOfDay: "breakfast" }
      } else {
        acc[zipCode] = { ...data, timeOfDay: "lunchOrDinner" }
      }
      return acc
    }, {})
}

async function updateWeather(zipCodes = []) {
  console.log("Inside Update Weather!!!")
  const utcNow = DateTime.utc()

  const allLocationData = await getLocationData(zipCodes)

  const validLocationData = await filterByTime(allLocationData, utcNow)

  let processedItems = 0
  const zipCodesToProcess = Object.keys(validLocationData)

  for (let i = 0; i < zipCodesToProcess.length; i += batchSize) {
    const batch = zipCodesToProcess.slice(i, i + batchSize)
    const catalogItems = []

    for (const zipCode of batch) {
      const { locationCode, timeOfDay, weatherSeverity, severityEffectiveEpochStart, severityEffectiveEpochEnd } = validLocationData[zipCode]

      try {
        const currentDate = utcNow.setZone(validLocationData[zipCode].timeZone).toISO().split("T")[0]
        const currentDateCatalog = utcNow.setZone(validLocationData[zipCode].timeZone).toISO()
        const currentDateString = utcNow.setZone(validLocationData[zipCode].timeZone).toFormat("yyyy-MM-dd")
        await incrementApiCallCount("AccuWeather")
        const response = await axios.get(`http://dataservice.accuweather.com/forecasts/v1/hourly/1hour/${locationCode}?apikey=${AW_API_KEY}`)
        const { IconPhrase, Temperature, PrecipitationProbability } = response.data[0]
        const currentTemp = Temperature.Value

        const climoData = await getClimoData(zipCode, currentDate)
        if (!climoData) {
          continue
        }

        const { avgHigh, avgLow } = climoData
        let unseasonable = "none"

        if (currentTemp > avgHigh + 15) {
          unseasonable = "hot"
        } else if (currentTemp < avgLow - 15) {
          unseasonable = "cold"
        }

        let weather = IconPhrase
        if (PrecipitationProbability >= 70) {
          if (rainPhrases.includes(IconPhrase)) {
            weather = "rain"
          } else if (snowPhrases.includes(IconPhrase)) {
            weather = "snow"
          }
        }

        let weatherSafety = "safe"
        const epochNow = DateTime.now().setZone(validLocationData[zipCode].timeZone).toSeconds()
        if (weatherSeverity === 1 && epochNow >= severityEffectiveEpochStart && epochNow <= severityEffectiveEpochEnd) {
          weatherSafety = "dangerous"
        }

        catalogItems.push({
          id: zipCode,
          zipCode,
          weather,
          temp: currentTemp,
          updateDateTime: currentDateCatalog,
          updateDateString: currentDateString, // Include the current date string in the catalog item
          precipitationChance: PrecipitationProbability,
          timeOfDay, // Include timeOfDay in the catalog item
          unseasonable, // Include unseasonable in the catalog item
          weatherSafety, // Include weatherSafety in the catalog item
        })
      } catch (error) {
        logToFile(`Error fetching weather for location code ${locationCode}: ${error.response ? error.response.data : error.message}`)
      }
    }

    try {
      const response = await axios.patch(
        `https://rest.iad-06.braze.com/catalogs/${CATALOG_NAME}/items`,
        { items: catalogItems },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${BRAZE_API_KEY}`,
          },
        }
      )
      zipCodesProcessed = zipCodesProcessed + catalogItems.length
      logToFile("Zip Codes processed for Weather Updates:  " + zipCodesProcessed)

      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests * 1000)) // Convert seconds to milliseconds
      processedItems += batch.length
    } catch (error) {
      logToFile("Error updating catalog:", error.response ? error.response.data : error.message)
    }
  }

  logToFile(`Total processed items: ${processedItems}`)
}

export async function updateWeatherForAllZipCodes() {
  await updateWeather()
}

export async function updateWeatherForSpecificZipCodes(zipCodes) {
  await updateWeather(zipCodes)
}
