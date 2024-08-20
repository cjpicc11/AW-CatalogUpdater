import deleteClimoData from "../../../helpers/deleteClimo" // Import the delete function
import updateClimoData from "../../../helpers/updateClimo" // Import the update function
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req

  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          const { zipCodes, yearMonth } = req.body

          logToFile("Inside POST call to update Climo data by zip code.")
          logToFile(`Zip Codes: ${zipCodes}`)

          // Validate that yearMonth is provided and in the correct format
          if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
            logToFile("ERROR: Invalid or missing yearMonth parameter.")
            return res.status(400).json({ success: false, message: "yearMonth is required and must be in 'yyyy-mm' format." })
          }

          // Validate that zipCodes is a non-empty array
          if (!zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
            logToFile("ERROR: Zip Codes are either not in an array or the array is empty!")
            return res.status(400).json({ success: false, message: "zipCodes must be a non-empty array." })
          }

          // Call the update function with zipCodes and yearMonth
          updateClimoData(zipCodes, yearMonth)

          res.status(200).json({ success: true, message: "Climo data updates have initiated!" })
        } catch (error) {
          logToFile(`ERROR: There was a problem updating Climo data: ${error.message}`)
          res.status(500).json({ success: false, message: error.message })
        }
        break

      case "DELETE":
        try {
          const { zipCodes, yearMonth } = req.body

          logToFile("Inside DELETE call to remove Climo data by zip code.")
          logToFile(`Zip Codes: ${zipCodes}`)

          // Validate that yearMonth is provided and in the correct format
          if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
            logToFile("ERROR: Invalid or missing yearMonth parameter.")
            return res.status(400).json({ success: false, message: "yearMonth is required and must be in 'yyyy-mm' format." })
          }

          // Validate that zipCodes is a non-empty array
          if (!zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
            logToFile("ERROR: Zip Codes are either not in an array or the array is empty!")
            return res.status(400).json({ success: false, message: "zipCodes must be a non-empty array." })
          }

          // Call the delete function with zipCodes and yearMonth asynchronously
          deleteClimoData(zipCodes, yearMonth)
            .then(() => {
              logToFile("Climo data deletion completed.")
            })
            .catch(error => {
              logToFile(`ERROR: There was a problem deleting Climo data: ${error.message}`)
            })

          // Return immediate response
          res.status(200).json({ success: true, message: "Climo data deletion is in progress..." })
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
