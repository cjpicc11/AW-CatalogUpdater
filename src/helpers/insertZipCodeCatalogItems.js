import axios from "axios"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import logToFile from "../util/logger.js"
import { ALLOWED_TIMEZONES } from "@/util/constants.js"

const BRAZE_API_KEY = process.env.BRAZE_API
const BRAZE_API_DOMAIN = process.env.BRAZE_API_DOMAIN
const CATALOG_NAME = process.env.DAILY_FORECAST_CATALOG_NAME
const batchSize = 50

async function getValidLocationData() {
  try {
    await dbConnect()

    // Use $or to include locations either outside allowed time zones or where storeZipCode is not true
    const locations = await Location.find(
      { timeZone: { $in: ALLOWED_TIMEZONES }, storeZipCode: true } // Locations where storeZipCode is true
    )

    return locations.map(location => location.zipCode)
  } catch (error) {
    logToFile("Failed to read location data from database:", error)
    throw new Error(`Problem reading data from DB: ${error}`)
  }
}

async function insertZipCodeCatalogItems() {
  const zipCodes = await getValidLocationData()

  // Log the total number of locations that will be inserted into the Braze catalog
  logToFile(`Total Locations that will be added to Braze catalog: ${zipCodes.length}`)

  logToFile("Processing Locations for Catalog Insertion...")

  for (let i = 0; i < zipCodes.length; i += batchSize) {
    const batch = zipCodes.slice(i, i + batchSize)

    try {
      const response = await axios({
        method: "POST", // Change method to POST for insertion
        url: `https://${BRAZE_API_DOMAIN}/catalogs/${CATALOG_NAME}/items`,
        data: { items: batch.map(zipCode => ({ id: zipCode, zipCode })) }, // Populate id and zipCode with the same value
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BRAZE_API_KEY}`,
        },
      })

      logToFile(`Inserted ${i + batch.length} catalog items for zip codes where storeZipCode is true`)
    } catch (error) {
      const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      logToFile(`Error inserting catalog items: ${errorDetails}`)
    }
  }

  logToFile("Finished inserting all catalog items where storeZipCode is true.")
}

export default insertZipCodeCatalogItems
