import deleteZipCodeCatalogItems from "../../../helpers/deleteZipCodeCatalogItems"
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "DELETE":
        try {
          logToFile("Inside Delete call to handle deletion of Catalog Items outside of timezones.")
          deleteZipCodeCatalogItems()
          res.status(200).json({ success: true, message: "Catalog Item Updates have initiated." })
        } catch (error) {
          res.status(500).json({ success: false, message: error.message })
        }
        break
      default:
        res.setHeader("Allow", ["DELETE"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
