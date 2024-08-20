import insertZipCodeCatalogItems from "../../../helpers/insertZipCodeCatalogItems" // Adjust the path as necessary
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req

  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          logToFile("Inside POST call to insert zip code catalog items.")

          // Call the helper function to insert catalog items
          insertZipCodeCatalogItems()

          logToFile("Catalog items insertion complete.")
          res.status(200).json({ success: true, message: "Catalog items insertion initiated." })
        } catch (error) {
          logToFile(`ERROR: There was a problem inserting catalog items: ${error.message}`)
          res.status(500).json({ success: false, message: error.message })
        }
        break

      default:
        res.setHeader("Allow", ["POST"])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  })
}
