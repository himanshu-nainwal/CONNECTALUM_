import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not Authorized, Please Login" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "connectalum_super_secret_key_change_in_production");
    
    // Check account status in DB
    const user = await User.findById(decoded.id).select("role is_suspended is_banned");
    if (!user) {
      return res.status(404).json({ success: false, message: "User account no longer exists" });
    }
    if (user.is_banned) {
      return res.status(403).json({ success: false, message: "Account has been suspended or banned by administration." });
    }

    req.userId = decoded.id;
    req.userRole = user.role || decoded.role;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(403).json({ success: false, message: "Invalid or Expired Token" });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${allowedRoles.join(", ")}] roles`,
      });
    }
    next();
  };
};

export default authMiddleware;
