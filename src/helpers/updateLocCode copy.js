import axios from "axios"
import { zipCodes } from "./zipCodes.js"
import { DateTime } from "luxon"
import { promises as fs } from "fs"

const BRAZE_UPDATE_BATCH_SIZE = 2 // Braze allows up to 50 items at a time
const API_DELAY = 1 // Delay between API calls in milliseconds, adjust as needed

const AW_API_KEY = process.env.AW_API
const BRAZE_API_KEY = process.env.BRAZE_API
const CATALOG_NAME = process.env.CATALOG_NAME
const delayBetweenRequests = 200
let numberIndex = 1
let counter = 0
let maxCounter = 3

const locationCodesPath = "./src/dataFiles/locationCodes.txt"

const batchSize = 50 // Set your desired batch size

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
  const locationCodes = []

  for (let i = 0; i < zipCodes.length && counter < maxCounter; i++) {
    try {
      let response = await axios.get(`https://dataservice.accuweather.com/locations/v1/postalcodes/search?apikey=${AW_API_KEY}&q=${zipCodes[i]}`)
      // locationCodes.push(response.data[0].Key)
      // await appendToFile(response.data[0].Key)
      //locationCodes.push("TESTCODE" + numberIndex)
      await appendToFile(zipCodes[i] + ":" + response.data[0].Key)
      //locationCodes.push("TEST_KEY_CPIC")
      //await new Promise(resolve => setTimeout(resolve, delayBetweenRequests)) // Adding delay between requests
      //console.log(zipCodes[i])
    } catch (error) {
      console.error("Error fetching location code:", error)
      locationCodes.push(null)
      throw error
    }
    numberIndex++
    counter++
  }

  // for (const zipCode of batch) {
  //   try {
  //     //const response = await axios.get(`https://dataservice.accuweather.com/locations/v1/postalcodes/search?apikey=${AW_API_KEY}&q=${zipCode}`)
  //     // locationCodes.push(response.data[0].Key)
  //     // await appendToFile(response.data[0].Key)
  //     locationCodes.push("TESTCODE" + numberIndex)
  //     await appendToFile(zipCode + ":" + "TESTCODE" + numberIndex)
  //     //locationCodes.push("TEST_KEY_CPIC")
  //     await new Promise(resolve => setTimeout(resolve, delayBetweenRequests)) // Adding delay between requests
  //   } catch (error) {
  //     console.error("Error fetching location code:", error)
  //     locationCodes.push(null)
  //     throw error
  //   }
  //   numberIndex++
  // }
  return locationCodes
}

async function createZipToLocationMapping(batch) {
  const locationCodes = []
  for (const zipCode of batch) {
    try {
      //const response = await axios.get(`https://dataservice.accuweather.com/locations/v1/postalcodes/search?apikey=${AW_API_KEY}&q=${zipCode}`)
      // locationCodes.push(response.data[0].Key)
      // await appendToFile(response.data[0].Key)
      locationCodes.push("TESTCODE" + numberIndex)
      await appendToFile(zipCode + ":" + "TESTCODE" + numberIndex)
      //locationCodes.push("TEST_KEY_CPIC")
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests)) // Adding delay between requests
    } catch (error) {
      console.error("Error fetching location code:", error)
      locationCodes.push(null)
      throw error
    }
    numberIndex++
  }
  return locationCodes
}

async function updateCatalogWithLocationCodes() {
  const totalZipCodes = zipCodes.length

  console.log("Length:  " + zipCodes.length)
  for (let i = 0; i < totalZipCodes; i += batchSize) {
    const batch = zipCodes.slice(i, i + batchSize)
    const locationCodes = await getLocationCodes(batch)
    const currentDate = DateTime.utc().toISO()

    const catalogItems = []
    for (let j = 0; j < batch.length; j++) {
      catalogItems.push({
        id: batch[j].toString(), // Assuming zipCodes is an array of unique identifiers for your catalog items
        zipCode: batch[j].toString(), // Assuming zipCodes is an array of unique identifiers for your catalog items
        locationCode: locationCodes[j],
        updateDate: currentDate,
      })
    }

    const testPayload = {
      items: catalogItems,
    }

    console.log("testPayload")
    console.log(testPayload)
    // Update catalog using Braze API
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
    } catch (error) {
      console.error("Error updating catalog:", error.response ? error.response.data : error.message)
    }
  }
}

async function readLocationCodes() {
  try {
    const data = await fs.readFile(locationCodesPath, "utf8")
    let zipLocationCodes
    const allZipLocationCodes = data.split(",").filter(Boolean) // Split by comma and remove any empty entries
    //const zipLocationCodes = data.split(",").filter(Boolean) // Split by comma and remove any empty entries
    console.log(allZipLocationCodes)
    for (let i = 0; i < allZipLocationCodes.length; i++) {
      zipLocationCodes = allZipLocationCodes[i].split(":").filter(Boolean)
      console.log("Zip Code:  " + zipLocationCodes[0])
      console.log("Location Code:  " + zipLocationCodes[1])
    }
    return "COMPLETE"
  } catch (error) {
    console.error("Error reading the file:", error)
  }
}

async function updateLocCode() {
  clearLocationCodeFile()
  getAndSetLocationCodes()
  //readLocationCodes()

  //createZipToLocationMapping()
  //updateCatalogWithLocationCodes()
  //console.log("Complete")
}

module.exports.updateLocCode = updateLocCode
