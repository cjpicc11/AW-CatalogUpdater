import { updateWeatherForAllZipCodes } from "../../../helpers/updateWeather"
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          logToFile("Inside POST call to update weather forecast for All zips.")
          updateWeatherForAllZipCodes()
          res.status(200).json({ success: true, message: "Weather data updates has started for all zip codes" })
        } catch (error) {
          res.status(500).json({ success: false, message: error.message })
        }
        break
      default:
        res.setHeader("Allow", ["POST"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
