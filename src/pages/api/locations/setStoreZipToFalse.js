// pages/api/locations/updateSpecific.js

import deleteZipCodeCatalogItems from "../../../helpers/setStoreZipCodeToFalse"
import { authenticateToken } from "../../../middleware/auth"
export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "PUT":
        try {
          deleteZipCodeCatalogItems()
          res.status(200).json({ success: true, message: "Location Key StoreZip Updates." })
        } catch (error) {
          res.status(500).json({ success: false, message: error.message })
        }
        break
      default:
        res.setHeader("Allow", ["PUT"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
