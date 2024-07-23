import { updateWeatherSeverityForAllZipCodes } from "../../../helpers/updateWeatherSeverity"

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case "POST":
      try {
        updateWeatherSeverityForAllZipCodes()
        res.status(200).json({ success: true, message: "Weather severity updates has initiated!" })
      } catch (error) {
        res.status(500).json({ success: false, message: error.message })
      }
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
