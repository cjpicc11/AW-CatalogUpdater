import { updateWeatherForAllZipCodes } from "../../../helpers/updateWeather"
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          const { batch } = req.body

          logToFile("Inside POST call to update weather forecast for all zip codes.")
          logToFile(`Batch: ${batch}`)

          // Validate that batch is provided and is an integer
          if (typeof batch !== "number" || !Number.isInteger(batch)) {
            logToFile("ERROR: Batch is not an integer!")
            return res.status(400).json({ success: false, message: "batch must be an integer" })
          }

          // Call the helper function to update the weather forecast for all zip codes
          updateWeatherForAllZipCodes(batch)

          res.status(200).json({ success: true, message: "Weather data updates have started for all zip codes." })
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
