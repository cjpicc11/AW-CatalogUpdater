import { axios } from "axios"
import { zipCodes } from "./zipCodes.js"
import { DateTime } from "luxon"
const BRAZE_UPDATE_BATCH_SIZE = 50 // Braze allows up to 50 items at a time
const API_DELAY = 1 // Delay between API calls in milliseconds, adjust as needed

const AW_API_KEY = process.env.AW_API
const BRAZE_API_KEY = process.env.BRAZE_API
const CATALOG_NAME = process.env.CATALOG_NAME
const delayBetweenRequests = 200; // Set the delay in milliseconds

async function fetchWeatherForZipCode(zipCode) {
  try {
    const locationCodeURL = `https://dataservice.accuweather.com/locations/v1/postalcodes/search?apikey=${AW_API_KEY}=${zipCode}`
    const locCodeResponse = await axios.get(locationCodeURL)
    console.log("locCodeResponse")
    console.log(locCodeResponse)
    const locCode = locCodeResponse.data[0].api_key

    const currentCondURL = `http://dataservice.accuweather.com/currentconditions/v1/${locCode}?apiKey=${AW_API_KEY}`
    const currentCondResponse = await axios.get(currentCondURL)
    const weatherData = {
      weatherText: currentCondResponse.data[0].weatherText,
      weatherCode: currentCondResponse.data[0].weatherIcon,
    }
    console.log("weatherData")
    console.log(weatherData)
    return { zipCode, weatherData }
  } catch (error) {
    console.error(`Error fetching weather for zip code ${zipCode}: ${error}`)
    return null // Return null or some error indicator as needed
  }
}

async function updateBrazeCatalogInBatches(batches) {
  for (const batch of batches) {
    try {
      const lastUpdated = DateTime.utc().toISO()
      const itemsToUpdate = batch.map(({ zipCode, weatherData }) => ({
        item_id: zipCode,
        weather: weatherData, // Simplified, adjust based on how you want to format the weather data
        last_updated: lastUpdated,
        last_updated: lastUpdated,
      }))

      // Placeholder for Braze API URL
      const url = "https://rest.iad-01.braze.com/catalog/items/update"
      await axios.put(url, {
        api_key: BRAZE_API_KEY, // Replace with your actual API key
        items: batch, // Assuming 'items' is the array of items to update, adjust according to the actual Braze API
      })
      console.log(`Successfully updated batch of ${batch.length} items in Braze catalog.`)
    } catch (error) {
      console.error(`Error updating Braze catalog: ${error}`)
    }
    await new Promise(resolve => setTimeout(resolve, API_DELAY)) // Wait before the next batch
  }
}

async function processZipCodes(zipCodes) {
  const weatherUpdates = await Promise.all(zipCodes.map(zipCode => fetchWeatherForZipCode(zipCode)))
  const validUpdates = weatherUpdates.filter(update => update !== null) // Filter out failed fetches

  // Split the updates into batches of 50
  const batches = []
  for (let i = 0; i < validUpdates.length; i += BRAZE_UPDATE_BATCH_SIZE) {
    const batch = validUpdates.slice(i, i + BRAZE_UPDATE_BATCH_SIZE).map(({ zipCode, weatherData }) => {
      // Transform each update into the format expected by Braze
      // This is a placeholder, replace with actual transformation logic
      return {
        id: zipCode,
        zipCode: zipCode,
        weatherCode: weatherData.weatherCode,
        weatherText: weatherData.weatherText,
      }
    })
    batches.push(batch)
  }

  // Update Braze catalog in batches
  await updateBrazeCatalogInBatches(batches)
}
async function catalogUpdater() {
  processZipCodes(zipCodes).then(() => console.log("Completed processing zip codes."))
}

module.exports.catalogUpdater = catalogUpdater
