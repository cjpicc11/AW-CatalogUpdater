export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token is missing or invalid" })
  }

  // Here, you should verify the token (e.g., using JWT or another method)
  // For simplicity, we will just check if the token matches a hardcoded value

  if (token !== process.env.ACCESS_TOKEN) {
    return res.status(403).json({ success: false, message: "Invalid access token" })
  }

  next()
}
