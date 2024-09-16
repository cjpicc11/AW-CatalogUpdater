// pages/api/logs/[date].js

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { authenticateToken } from "../../../middleware/auth"

// Convert file URL to path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure the logs directory exists
const ensureLogDirectory = () => {
  const logDirectory = path.join(__dirname, "..", "..", "..", "logs")
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true })
  }
}

// Get the log file path for the given date
const getLogFilePath = dateString => {
  const logFileName = `${dateString}_app.log`
  return path.join(__dirname, "..", "..", "..", "logs", logFileName)
}

export default async function handler(req, res) {
  const { method } = req

  // Get the date from the request parameters
  const { date } = req.query

  // Ensure the logs directory exists
  ensureLogDirectory()

  // Get the log file path for the given date
  const logFilePath = getLogFilePath(date)
  authenticateToken(req, res, async () => {
    switch (method) {
      case "GET":
        try {
          if (fs.existsSync(logFilePath)) {
            const logContents = fs.readFileSync(logFilePath, "utf8")
            const formattedLogContents = logContents.split("\n").join("<br>")

            res.status(200).json({ success: true, logData: formattedLogContents })
          } else {
            res.status(404).json({ success: false, message: "Log file not found" })
          }
        } catch (error) {
          res.status(500).json({ success: false, message: error.message })
        }
        break
      default:
        res.setHeader("Allow", ["GET"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
