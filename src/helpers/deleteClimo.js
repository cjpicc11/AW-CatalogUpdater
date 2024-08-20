import mongoose from "mongoose"
import logToFile from "../util/logger.js" // Import the logToFile function
import Climo from "../models/Climo.js" // Import the Climo model
import dbConnect from "../util/dbConnect.js"

const deleteClimoDataByMonthYear = async (yearMonth, zipCodes = []) => {
  try {
    await dbConnect()

    // Extract year and month from the passed mm/yyyy string
    const [year, month] = yearMonth.split("-")
    if (!year || !month || year.length !== 4 || month.length !== 2) {
      throw new Error("Invalid yearMonth format. It should be in 'mm/yyyy' format.")
    }

    logToFile(`Clearing Climo data for month ${month} and year ${year}.`)

    // Build the query to delete Climo data by date string and zip codes (if provided)
    const query = {
      dateString: { $regex: `^${year}-${month.padStart(2, "0")}-` },
    }

    // If zip codes are provided, include them in the query
    if (zipCodes.length > 0) {
      query.zipCode = { $in: zipCodes }
    }

    // Delete existing Climo data for the specified month, year, and zip codes (if any)
    await Climo.deleteMany(query)
    logToFile(`Cleared Climo data for month ${month}, year ${year}${zipCodes.length ? `, and zip codes ${zipCodes.join(", ")}` : ""}.`)
  } catch (error) {
    logToFile(`Error deleting Climo data: ${error.message}`)
  }
}

const deleteClimoData = async (zipCodes = [], yearMonth) => {
  try {
    // Delete Climo data by month, year, and zip codes (if provided)
    await deleteClimoDataByMonthYear(yearMonth, zipCodes)

    logToFile(`Climo data cleared for ${yearMonth}${zipCodes.length ? ` and zip codes ${zipCodes.join(", ")}` : ""}.`)
  } catch (error) {
    logToFile(`Error processing Climo data: ${error.message}`)
  }
}

export default deleteClimoData
