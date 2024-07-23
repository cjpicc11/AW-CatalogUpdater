import { updateWeatherSeverityForSpecificZipCodes } from "../../../helpers/updateWeatherSeverity"

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case "POST":
      try {
        const { zipCodes } = req.body
        if (!zipCodes || !Array.isArray(zipCodes)) {
          return res.status(400).json({ success: false, message: "zipCodes must be an array" })
        }
        updateWeatherSeverityForSpecificZipCodes(zipCodes)
        res.status(200).json({ success: true, message: "Weather severity updates by zip codes has initiated!" })
      } catch (error) {
        res.status(500).json({ success: false, message: error.message })
      }
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
