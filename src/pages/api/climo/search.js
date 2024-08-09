// pages/api/climo/search.js

import dbConnect from "../../../util/dbConnect"
import Climo from "../../../models/Climo"
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req
  const { zipCode, dateString } = req.query

  // Log the request details
  logToFile(`Received ${method} request for zipCode: ${zipCode} and dateString: ${dateString}`)

  // Connect to database
  await dbConnect()
  authenticateToken(req, res, async () => {
    switch (method) {
      case "GET":
        try {
          // Search for the document by zipCode and dateString
          const result = await Climo.findOne({ zipCode, dateString })
          if (result) {
            logToFile("Data Payload Returned!")
            res.status(200).json({ success: true, data: result })
          } else {
            res.status(404).json({ success: false, message: "Data not found" })
          }
        } catch (error) {
          logToFile("ERROR:  There was a problem searching Climo data!!!")
          logToFile("ERROR MESSAGE:  " + error.message)
          res.status(500).json({ success: false, message: error.message })
        }
        break
      default:
        res.setHeader("Allow", ["GET"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
