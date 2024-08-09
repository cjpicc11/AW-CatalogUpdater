import updateClimoData from "../../../helpers/updateClimo" // Import the updated function
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          const { zipCodes } = req.body
          logToFile("Inside POST call to update Climo data by zip Code.")
          logToFile(`Zip Codes:  ${zipCodes}`)

          if (!zipCodes || !Array.isArray(zipCodes)) {
            logToFile("ERROR:  Zip Codes are NOT in Array!")
            return res.status(400).json({ success: false, message: "zipCodes must be an array" })
          }

          updateClimoData(zipCodes) // Call the new Climo function

          logToFile("Climo data updates by ZipCode is a success!")
          res.status(200).json({ success: true, message: "Climo data updates have initiated!" })
        } catch (error) {
          logToFile("ERROR:  There was a problem!!")
          res.status(500).json({ success: false, message: error.message })
        }
        break
      default:
        res.setHeader("Allow", ["POST"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
