import mongoose from "mongoose"

const ClimoSchema = new mongoose.Schema({
  zipCode: { type: String, required: true },
  dateString: { type: String, required: true },
  avgLow: { type: Number, required: true },
  avgHigh: { type: Number, required: true },
})

const Climo = mongoose.models.Climo || mongoose.model("Climo", ClimoSchema)

export default Climo
