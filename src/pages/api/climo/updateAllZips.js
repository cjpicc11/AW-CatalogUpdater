import updateClimoData from "../../../helpers/updateClimo" // Import the updated function
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"
import Location from "../../../models/Location" // Import the Location model

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          logToFile("Inside POST call to update Climo data for all zip codes.")

          // Fetch all zip codes from the Location model
          const locations = await Location.find({})
          const zipCodes = locations.map(location => location.zipCode)

          logToFile(`Updating Climo data for all zip codes: ${zipCodes.join(", ")}`)

          // Call the function to update Climo data for all zip codes
          await updateClimoData(zipCodes)

          logToFile("Climo data update for all zip codes is a success!")
          res.status(200).json({ success: true, message: "Climo data update for all zip codes has initiated!" })
        } catch (error) {
          logToFile("ERROR: There was a problem updating Climo data for all zip codes!!")
          res.status(500).json({ success: false, message: error.message })
        }
        break
      default:
        res.setHeader("Allow", ["POST"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
