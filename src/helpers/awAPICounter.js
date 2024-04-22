import { promises as fs } from "fs"

const awCounterFilePath = "./src/dataFiles/AWCounter.txt"

// Function to increment the API call counter
async function incrementAPICallCounter() {
  try {
    // Try to read the current counter value
    let count = await fs.readFile(awCounterFilePath, "utf8")
    count = parseInt(count, 10) + 1 // Increment the count
    console.log("count")
    console.log(count)
    // Write the updated count back to the file
    await fs.writeFile(awCounterFilePath, count.toString(), "utf8")
    console.log(`API Call Count updated to: ${count}`)
  } catch (error) {
    if (error.code === "ENOENT") {
      // If the file doesn't exist, create it and initialize with 1
      await fs.writeFile(awCounterFilePath, "1", "utf8")
      console.log("API Call Count file created and set to 1.")
    } else {
      // Log other errors
      console.error("Error updating API Call Count:", error)
    }
  }
}

// Function to reset counter to 0
async function resetAPICallCounter() {
  try {
    // Try to read the current counter value
    let count = await fs.readFile(awCounterFilePath, "utf8")
    count = parseInt(count, 10) + 1 // Increment the count
    console.log("count")
    console.log(count)
    // Write the updated count back to the file
    await fs.writeFile(awCounterFilePath, "0", "utf8")
    console.log(`API Call Count updated to: 0`)
  } catch (error) {
    if (error.code === "ENOENT") {
      // If the file doesn't exist, create it and initialize with 1
      await fs.writeFile(awCounterFilePath, "0", "utf8")
      console.log("API Call Count file created and set to 0.")
    } else {
      // Log other errors
      console.error("Error updating API Call Count:", error)
    }
  }
}
// Function to get AW API Counts
async function getAPICallCounter() {
  try {
    // Try to read the current counter value
    let count = await fs.readFile(awCounterFilePath, "utf8")
    count = parseInt(count, 10)

    return count
  } catch (error) {
    if (error.code === "ENOENT") {
      // If the file doesn't exist, create it and initialize with 1
      return "unable to read Counts.  Error:  " + error
    } else {
      // Log other errors
      console.error("Error updating API Call Count:", error)
    }
  }
}

module.exports.incrementAPICallCounter = incrementAPICallCounter
module.exports.resetAPICallCounter = resetAPICallCounter
module.exports.getAPICallCounter = getAPICallCounter
