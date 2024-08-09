import mongoose from "mongoose"
import logToFile from "../util/logger"

const connection = {}

async function dbConnect() {
  if (connection.isConnected) {
    return
  }

  if (mongoose.connections.length > 0 && mongoose.connections[0].readyState === 1) {
    connection.isConnected = true
    return
  }

  const db = await mongoose.connect(process.env.MONGO_URI, {})

  connection.isConnected = db.connections[0].readyState
  logToFile("Database Connected!!! " + connection.isConnected)
}

export default dbConnect
