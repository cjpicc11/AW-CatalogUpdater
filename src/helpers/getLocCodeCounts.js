import axios from "axios"
import { zipCodes } from "./zipCodes.js"
import { DateTime } from "luxon"
import { promises as fs } from "fs"
const locationCodesPath = "./src/dataFiles/locationCodes.txt"
const AW_API_KEY = process.env.AW_API

async function getLocCodeCounts() {
  //const totalZipCodes = zipCodes.length
  const data = await fs.readFile(locationCodesPath, "utf8")
  const locationCodeEntries = data.split(",").filter(Boolean)
  if (locationCodeEntries) {
    if (locationCodeEntries.length > 0) {
      return locationCodeEntries.length
    }
  }
  return 0
}

module.exports.getLocCodeCounts = getLocCodeCounts
