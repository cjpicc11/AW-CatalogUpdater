import dbConnect from "../util/dbConnect"
import ApiCallCount from "../models/ApiCallCount"
import logToFile from "../util/dbConnect"

export async function incrementApiCallCount(apiName) {
  try {
    await dbConnect()

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // JavaScript months are 0-11, so add 1 to get 1-12

    const result = await ApiCallCount.findOneAndUpdate({ api: apiName, year, month }, { $inc: { count: 1 } }, { new: true, upsert: true })
  } catch (error) {
    logToFile(`Failed to increment API call count for ${apiName}: ${error.message}`)
  }
}
