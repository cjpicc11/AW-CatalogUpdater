import dbConnect from "../../../util/dbConnect"
import ApiCallCount from "../../../models/ApiCallCount"
import logToFile from "../../../util/logger"
import { authenticateToken } from "../../../middleware/auth"

export default async function handler(req, res) {
  const { method } = req

  // Authenticate token
  authenticateToken(req, res, async () => {
    if (method !== "GET") {
      res.setHeader("Allow", ["GET"])
      return res.status(405).end(`Method ${method} Not Allowed`)
    }

    const { api, month, year } = req.query

    try {
      await dbConnect()

      let query = {}

      if (api) {
        query.api = api
      }

      if (month) {
        query.month = parseInt(month, 10)
      }

      if (year) {
        query.year = parseInt(year, 10)
      }

      const callCounts = await ApiCallCount.find(query)

      if (!callCounts.length) {
        return res.status(404).json({ success: false, message: "No call counts found for the specified parameters" })
      }

      res.status(200).json({ success: true, apiCounts: callCounts })
    } catch (error) {
      logToFile(`Error fetching API call counts: ${error.message}`)
      res.status(500).json({ success: false, message: "Server Error" })
    }
  })
}
