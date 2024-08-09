import { generateClimoData } from "../../../helpers/generateClimoData"
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req
  authenticateToken(req, res, async () => {
    switch (method) {
      case "POST":
        try {
          logToFile("Inside POST call to Generate Climo Data.")
          generateClimoData()
          res.status(200).json({ success: true, message: "Climo Data Generation has started" })
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
