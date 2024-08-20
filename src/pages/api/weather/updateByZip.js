import { updateWeatherForSpecificZipCodes } from "../../../helpers/updateWeather"
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          const { zipCodes, batch } = req.body

          logToFile("Inside POST call to update weather forecast by zip code.")
          logToFile(`Zip Codes: ${zipCodes}`)
          logToFile(`Batch: ${batch}`)

          // Validate that zipCodes is provided and is an array
          if (!zipCodes || !Array.isArray(zipCodes)) {
            logToFile("ERROR: Zip Codes are NOT in Array!")
            return res.status(400).json({ success: false, message: "zipCodes must be an array" })
          }

          // Validate that batch is provided and is an integer
          if (typeof batch !== "number" || !Number.isInteger(batch)) {
            logToFile("ERROR: Batch is not an integer!")
            return res.status(400).json({ success: false, message: "batch must be an integer" })
          }

          // Call the helper function to update the weather forecast
          updateWeatherForSpecificZipCodes(zipCodes, batch)

          logToFile("Weather Updates by Zip Code is a success!")
          res.status(200).json({ success: true, message: "Weather data updates have initiated!" })
        } catch (error) {
          logToFile(`ERROR: There was a problem - ${error.message}`)
          res.status(500).json({ success: false, message: error.message })
        }
        break

      default:
        res.setHeader("Allow", ["POST"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
