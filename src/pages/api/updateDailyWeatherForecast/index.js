import { getAndSetDailyWeatherForecast } from "../../../helpers/getAndSetDailyWeatherForecast"

export default async (req, res) => {
  const { method } = req

  switch (method) {
    case "GET":
      try {
        getAndSetDailyWeatherForecast()
        return res.status(200).json({ success: true, data: "Updating Daily Weather in progress..." })
      } catch (err) {
        return res.status(400).json({ success: false, message: "Houston...We have a problem!" })
      }
    default:
      res.status(200).json({ success: false, message: "Invalid CRUD operation!" })
  }
}
