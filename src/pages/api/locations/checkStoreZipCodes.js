import { authenticateToken } from "../../../middleware/auth"
import logToFile from "../../../util/logger.js"
import checkStoreZipCodes from "../../../helpers/checkStoreZipCodes"

export default async function handler(req, res) {
  const { method } = req

  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          const { zipCodes } = req.body

          if (!zipCodes || !Array.isArray(zipCodes)) {
            logToFile("ERROR: zipCodes must be provided as an array.")
            return res.status(400).json({ success: false, message: "zipCodes must be an array" })
          }

          logToFile(`Checking storeZipCode for zip codes: ${zipCodes.join(", ")}`)

          const result = await checkStoreZipCodes(zipCodes)
          return res.status(200).json({ success: true, data: result })
        } catch (error) {
          logToFile(`ERROR: ${error.message}`)
          return res.status(500).json({ success: false, message: error.message })
        }
      default:
        res.setHeader("Allow", ["POST"])
        return res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
