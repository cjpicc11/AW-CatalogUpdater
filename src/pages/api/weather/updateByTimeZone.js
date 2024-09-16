import { updateWeatherByTimeZone } from "../../../helpers/updateWeather" // Use the updated function
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"
import { EAST_TIMEZONES, CENTRAL_TIMEZONES, MOUNTAIN_TIMEZONES, WEST_TIMEZONES } from "@/util/constants" // Import the time zone constants

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          const { timeZone, batch } = req.body

          logToFile("Inside POST call to update weather forecast by time zone.")
          logToFile(`Time Zone: ${timeZone}`)
          logToFile(`Batch: ${batch}`)

          // Validate that timeZone is provided and is a string
          if (!timeZone || typeof timeZone !== "string") {
            logToFile("ERROR: Time Zone is not provided or not a string!")
            return res.status(400).json({ success: false, message: "timeZone must be a string" })
          }

          // Validate that batch is provided and is an integer
          if (typeof batch !== "number" || !Number.isInteger(batch)) {
            logToFile("ERROR: Batch is not an integer!")
            return res.status(400).json({ success: false, message: "batch must be an integer" })
          }

          // Map timeZone to actual allowed time zones
          let allowedTimeZones = []
          switch (timeZone.toLowerCase()) {
            case "east":
              allowedTimeZones = EAST_TIMEZONES
              break
            case "central":
              allowedTimeZones = CENTRAL_TIMEZONES
              break
            case "mountain":
              allowedTimeZones = MOUNTAIN_TIMEZONES
              break
            case "west":
              allowedTimeZones = WEST_TIMEZONES
              break
            default:
              logToFile("ERROR: Invalid time zone provided!")
              return res
                .status(400)
                .json({ success: false, message: "Invalid timeZone provided. Acceptable values are: east, central, mountain, west" })
          }

          // Call the helper function to update the weather forecast by time zone
          updateWeatherByTimeZone(allowedTimeZones, batch)

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
