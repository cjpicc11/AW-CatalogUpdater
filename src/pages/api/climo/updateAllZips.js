import updateClimoData from "../../../helpers/updateClimo" // Import the functions
import deleteClimoData from "../../../helpers/deleteClimo" // Import the functions
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req

  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          const { yearMonth } = req.body

          // Validate that yearMonth is provided and in the correct yyyy-mm format
          if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
            logToFile("ERROR: Invalid or missing yearMonth parameter.")
            return res.status(400).json({ success: false, message: "yearMonth is required and must be in 'yyyy-mm' format." })
          }

          logToFile("Inside POST call to update Climo data.")

          // Call the function to update Climo data with the provided yearMonth
          updateClimoData([], yearMonth) // Passing an empty array for zipCodes, which means update all locations

          res.status(200).json({ success: true, message: "Climo data update has initiated!" })
        } catch (error) {
          logToFile(`ERROR: There was a problem updating Climo data: ${error.message}`)
          res.status(500).json({ success: false, message: error.message })
        }
        break
      case "DELETE":
        try {
          const { yearMonth } = req.body

          // Validate that yearMonth is provided and in the correct yyyy-mm format
          if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
            logToFile("ERROR: Invalid or missing yearMonth parameter.")
            return res.status(400).json({ success: false, message: "yearMonth is required and must be in 'yyyy-mm' format." })
          }

          logToFile("Inside DELETE call to delete Climo data.")

          // Call the function to delete Climo data with the provided yearMonth
          deleteClimoData([], yearMonth)

          res.status(200).json({ success: true, message: "Climo data deletion in progress..." })
        } catch (error) {
          logToFile(`ERROR: There was a problem deleting Climo data: ${error.message}`)
          res.status(500).json({ success: false, message: error.message })
        }
        break
      default:
        res.setHeader("Allow", ["POST", "DELETE"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
