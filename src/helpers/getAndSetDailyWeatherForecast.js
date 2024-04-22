import axios from "axios"
import { DateTime } from "luxon"
import { promises as fs } from "fs"
import { incrementAPICallCounter } from "../../src/helpers/awAPICounter.js"

const AW_API_KEY = process.env.AW_API
const BRAZE_API_KEY = process.env.BRAZE_API
const CATALOG_NAME = process.env.DAILY_FORECAST_CATALOG_NAME
const delayBetweenRequests = 200
let counter = 0
let maxCounter = 20
const batchSize = 50 // Set your desired batch size

const locationCodesPath = "./src/dataFiles/locationCodes.txt"

async function getLocationCodes(batch) {
  try {
    const data = await fs.readFile(locationCodesPath, "utf8")
    const zipCodeMap = data.split(",").reduce((acc, item) => {
      const [zipCode, locationCode] = item.split(":")
      acc[zipCode.trim()] = locationCode.trim()
      return acc
    }, {})

    return batch.map(zipCode => zipCodeMap[zipCode.toString()] || "Unknown") // Map each zip code in the batch to its location code or 'Unknown' if not found
  } catch (error) {
    console.error("Failed to read location codes from file:", error)
    return batch.map(() => "Unknown") // Return 'Unknown' for all if there's an error
  }
}

async function getAndSetWeatherDailyForecastData() {
  //const totalZipCodes = zipCodes.length
  const data = await fs.readFile(locationCodesPath, "utf8")
  const locationCodeEntries = data.split(",").filter(Boolean)
  console.log(locationCodeEntries)

  let processedItems = 0

  //console.log("Length:  " + zipCodes.length)
  for (let i = 0; i < locationCodeEntries.length && counter < maxCounter; i += batchSize) {
    const currentBatchEntries = locationCodeEntries.slice(i, i + batchSize)
    const batch = currentBatchEntries.map(entry => entry.split(":")[0]) // Extract zip codes from entries
    const locationCodes = await getLocationCodes(batch)
    console.log("Processing batch:", batch)
    console.log("Location codes:", locationCodes)
    const currentDate = DateTime.utc().toISO()

    let catalogItems = []
    for (let j = 0; j < batch.length && processedItems < maxCounter; j++) {
      try {
        let response = await axios.get(`http://dataservice.accuweather.com/forecasts/v1/daily/1day/${locationCodes[j]}?apikey=${AW_API_KEY}`)
        catalogItems.push({
          id: batch[j].toString(),
          zipCode: batch[j],
          weather: response.data.Headline.Category,
          highTemp: response.data.DailyForecasts[0].Temperature.Maximum.Value,
          lowTemp: response.data.DailyForecasts[0].Temperature.Minimum.Value,
          updateDate: currentDate,
        })
        await incrementAPICallCounter()
        processedItems++ // Increment processedItems for each item added
      } catch (error) {
        console.error("Error fetching location code:", error)
        throw error
      }
    }

    const testPayload = {
      items: catalogItems,
    }

    console.log("testPayload")
    console.log(testPayload)
    //Update catalog using Braze API
    try {
      const response = await axios.put(
        `https://rest.iad-06.braze.com/catalogs/${CATALOG_NAME}/items`,
        { items: catalogItems },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${BRAZE_API_KEY}`,
          },
        }
      )
      // const response = {
      //   data: "success",
      // }
      console.log("BRAZE API CALL!!!")

      console.log("Catalog updated:", response.data)
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests)) // Adding delay between requests
    } catch (error) {
      console.error("Error updating catalog:", error.response ? error.response.data : error.message)
    }
    counter++
  }
}

async function getAndSetDailyWeatherForecast() {
  getAndSetWeatherDailyForecastData()
}

module.exports.getAndSetDailyWeatherForecast = getAndSetDailyWeatherForecast
