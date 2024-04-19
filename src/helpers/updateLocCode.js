import axios from "axios"
import { zipCodes } from "./zipCodes.js"
import { DateTime } from "luxon"
import { promises as fs } from "fs"
const locationCodesPath = "./src/dataFiles/locationCodes.txt"
const AW_API_KEY = process.env.AW_API

let counter = 0
let maxCounter = 10

async function clearLocationCodeFile() {
  const filePath = locationCodesPath
  try {
    fs.writeFile(filePath, "")
    console.log("The file has been cleared!")
  } catch (err) {
    console.error("Failed to clear the file:", err)
    throw err // Rethrow the error to handle it outside if needed
  }
}

async function appendToFile(data) {
  try {
    // Read the existing content of the file to determine if a comma is needed before appending new data
    const existingContent = await fs.readFile(locationCodesPath, "utf8")
    const separator = existingContent.length > 0 ? "," : "" // Only add a comma if there is already content in the file
    await fs.appendFile(locationCodesPath, `${separator}${data}`)
  } catch (error) {
    console.error("Failed to write to file:", error)
  }
}

async function getAndSetLocationCodes() {
  for (let i = 0; i < zipCodes.length && counter < maxCounter; i++) {
    try {
      let response = await axios.get(`https://dataservice.accuweather.com/locations/v1/postalcodes/search?apikey=${AW_API_KEY}&q=${zipCodes[i]}`)
      await appendToFile(zipCodes[i] + ":" + response.data[0].Key)
    } catch (error) {
      console.error("Error fetching location code:", error)

      throw error
    }
    counter++
  }

  return "success"
}

async function updateLocCode() {
  clearLocationCodeFile()
  getAndSetLocationCodes()
}

module.exports.updateLocCode = updateLocCode
