import axios from "axios"
import mongoose from "mongoose"
import dbConnect from "../util/dbConnect.js"
import Location from "../models/Location.js"
import logToFile from "../util/logger.js"
import { incrementApiCallCount } from "./incrementApiCallCount.js"

const AW_API_KEY = process.env.AW_API

async function updateAllZipCodes() {
  try {
    await dbConnect()
    logToFile("Connected to database.")

    const locations = await Location.find({})
    for (const location of locations) {
      await updateZipCode(location.zipCode)
    }

    logToFile("All zip codes updated successfully.")
  } catch (error) {
    logToFile(`Error updating all zip codes: ${error.message}`)
  }
}

async function updateSpecificZipCodes(zipCodes) {
  try {
    await dbConnect()
    logToFile("Connected to database.")

    for (const zipCode of zipCodes) {
      await updateZipCode(zipCode)
    }

    logToFile("Specific zip codes updated successfully.")
  } catch (error) {
    logToFile(`Error updating specific zip codes: ${error.message}`)
  }
}

async function updateZipCode(zipCode) {
  try {
    await incrementApiCallCount("AccuWeather")
    const response = await axios.get(`https://dataservice.accuweather.com/locations/v1/postalcodes/search?apikey=${AW_API_KEY}&q=${zipCode}`)
    const locationCode = response.data[0].Key
    const timeZone = response.data[0].TimeZone.Name

    await Location.findOneAndUpdate({ zipCode }, { locationCode, timeZone }, { new: true })

    logToFile(`Updated zip code ${zipCode} with location code ${locationCode} and time zone ${timeZone}`)
  } catch (error) {
    logToFile(`Error fetching location code for zip code ${zipCode}: ${error.message}`)
  }
}

export { updateAllZipCodes, updateSpecificZipCodes }
