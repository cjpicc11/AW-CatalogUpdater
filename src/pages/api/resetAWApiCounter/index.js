import { resetAPICallCounter } from "../../../helpers/awAPICounter"

export default async (req, res) => {
  const { method } = req

  switch (method) {
    case "GET":
      try {
        resetAPICallCounter()
        return res.status(200).json({ success: true, message: "API Counter has been Reset to 0" })
      } catch (err) {
        return res.status(400).json({ success: false, message: "Houston...We have a problem!" })
      }
    default:
      res.status(200).json({ success: false, message: "Invalid CRUD operation!" })
  }
}
