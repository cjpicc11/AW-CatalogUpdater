import { getAPICallCounter } from "../../../helpers/awAPICounter"

export default async (req, res) => {
  const { method } = req

  switch (method) {
    case "GET":
      try {
        const counts = await getAPICallCounter()
        return res.status(200).json({ success: true, count: counts })
      } catch (err) {
        return res.status(400).json({ success: false, message: "Houston...We have a problem!  " + err })
      }
    default:
      res.status(200).json({ success: false, message: "Invalid CRUD operation!" })
  }
}
