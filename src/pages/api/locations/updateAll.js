// pages/api/locations/updateAll.js

import updateLocationData from "../../../helpers/updateLocationCodes"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          updateLocationData()
          res.status(200).json({ success: true, message: "Location Key Updates Initiated" })
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
