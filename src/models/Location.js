import mongoose from "mongoose"

const LocationDataSchema = new mongoose.Schema({
  zipCode: { type: String, required: true, unique: true },
  locationCode: { type: String, required: true },
  timeZone: { type: String, required: true },
  storeZipCode: { type: Boolean, required: false },
  weatherSeverity: { type: Number, required: false },
  severityEffectiveEpochStart: { type: Number, required: false },
  severityEffectiveEpochEnd: { type: Number, required: false },
})

const Location = mongoose.models.Location || mongoose.model("Location", LocationDataSchema)

export default Location
