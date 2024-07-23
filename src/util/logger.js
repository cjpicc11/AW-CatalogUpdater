// util/logger.js

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Convert file URL to path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure the logs directory exists
const ensureLogDirectory = () => {
  const logDirectory = path.join(__dirname, "..", "logs")
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true })
  }
}

// Get the log file path for the current date
const getLogFilePath = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const dateString = `${year}${month}${day}`
  const logFileName = `${dateString}_app.log`
  return path.join(__dirname, "..", "logs", logFileName)
}

// Function to log messages to the file
const logToFile = message => {
  ensureLogDirectory()

  const logFilePath = getLogFilePath()
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`

  fs.appendFileSync(logFilePath, logMessage, "utf8")
}

export default logToFile
