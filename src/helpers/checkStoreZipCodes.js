import Location from "../models/Location"
import { ALLOWED_TIMEZONES } from "../util/constants.js"
import logToFile from "../util/logger.js"

export default async function checkStoreZipCodes(zipCodes) {
  try {
    logToFile(`Starting check for storeZipCode status on ${zipCodes.length} zip codes`)

    const locations = await Location.find({
      zipCode: { $in: zipCodes },
    })

    // Extract zip codes that are not set to true and within allowed timezones
    const missingZipCodes = zipCodes.filter(zip => !locations.some(location => location.zipCode === zip && location.storeZipCode === true))

    if (missingZipCodes.length > 0) {
      logToFile(`Found ${missingZipCodes.length} zip codes not set to true`)

      // Add missing zip codes to the database with storeZipCode set to true
      const newLocations = missingZipCodes.map(zipCode => ({
        zipCode,
        storeZipCode: true,
        // Default values, you may want to customize these
        locationCode: "NULL",
        timeZone: "NULL", // You can add logic here to determine the timeZone if needed
      }))

      await Location.insertMany(newLocations)
      logToFile(`Inserted ${newLocations.length} new locations into the database`)
    } else {
      logToFile(`All zip codes are already set to true or do not need updating`)
    }

    return missingZipCodes
  } catch (error) {
    logToFile(`ERROR in checkStoreZipCodes: ${error.message}`)
    throw new Error(error.message)
  }
}
