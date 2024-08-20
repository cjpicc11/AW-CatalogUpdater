import axios from "axios"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import logToFile from "../util/logger.js"
import { ALLOWED_TIMEZONES } from "@/util/constants.js"

const BRAZE_API_KEY = process.env.BRAZE_API
const BRAZE_API_DOMAIN = process.env.BRAZE_API_DOMAIN
const CATALOG_NAME = process.env.DAILY_FORECAST_CATALOG_NAME
const batchSize = 50

async function getLocationDataOutsideAllowedTimeZonesOrNotStoreZip() {
  try {
    await dbConnect()

    // Use $or to include locations either outside allowed time zones or where storeZipCode is not true
    const locations = await Location.find(
      { storeZipCode: true } // Locations where storeZipCode is not true
    )

    return locations.map(location => location.zipCode)
  } catch (error) {
    logToFile("Failed to read location data from database:", error)
    throw new Error(`Problem reading data from DB: ${error}`)
  }
}

async function deleteZipCodeCatalogItems() {
  const zipCodes = await getLocationDataOutsideAllowedTimeZonesOrNotStoreZip()

  // Log the total number of locations that will be removed from the Braze catalog
  logToFile(`Total Locations that will be removed from Braze catalog: ${zipCodes.length}`)

  logToFile("Processing Locations outside of Allowed Time Zones or where storeZipCode is not true for Catalog Deletion...")

  for (let i = 0; i < zipCodes.length; i += batchSize) {
    const batch = zipCodes.slice(i, i + batchSize)

    try {
      const response = await axios({
        method: "DELETE",
        url: `https://${BRAZE_API_DOMAIN}/catalogs/${CATALOG_NAME}/items`,
        data: { items: batch.map(zipCode => ({ id: zipCode })) },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BRAZE_API_KEY}`,
        },
      })

      logToFile(`Deleted ${i + batch.length} catalog items for zip codes outside of allowed time zones or where storeZipCode is not true`)
    } catch (error) {
      const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      logToFile(`Error deleting catalog items: ${errorDetails}`)
    }
  }

  logToFile("Finished deleting all catalog items outside of Allowed Time Zones or where storeZipCode is not true.")
}

export default deleteZipCodeCatalogItems
