import { updateLocCode } from "../../../helpers/updateLocCode"
import { getLocCodeCounts } from "../../../helpers/getLocCodeCounts"
import { incrementAPICallCounter } from "../../../helpers/awAPICounter"

export default async (req, res) => {
  const { method } = req

  switch (method) {
    case "GET":
      try {
        const locationCodeCounts = await getLocCodeCounts()
        return res.status(200).json({ success: true, count: locationCodeCounts })
      } catch (err) {
        return res.status(400).json({ success: false, message: "Houston...We have a problem!" })
      }
    default:
      res.status(200).json({ success: false, message: "Invalid CRUD operation!" })
  }
}
