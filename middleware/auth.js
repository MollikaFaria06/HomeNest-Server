const admin = require("../firebaseAdmin");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1]; // Bearer <token>
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // uid, email, etc.
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = verifyToken;
