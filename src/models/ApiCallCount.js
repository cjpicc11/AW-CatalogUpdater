import mongoose from "mongoose"

const ApiCallCountSchema = new mongoose.Schema({
  api: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  count: { type: Number, default: 0 },
})

ApiCallCountSchema.index({ api: 1, year: 1, month: 1 }, { unique: true })

const ApiCallCount = mongoose.models.ApiCallCount || mongoose.model("ApiCallCount", ApiCallCountSchema)

export default ApiCallCount
