// pages/api/locations/updateSpecific.js

import { updateSpecificZipCodes } from "../../../helpers/updateLocationCodes"
import { authenticateToken } from "../../../middleware/auth"
export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          const { zipCodes } = req.body
          if (!zipCodes || !Array.isArray(zipCodes)) {
            return res.status(400).json({ success: false, message: "zipCodes must be an array" })
          }
          await updateSpecificZipCodes(zipCodes)
          res.status(200).json({ success: true, message: "Specific zip codes updated successfully" })
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
