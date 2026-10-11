import express from "express";
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  toggleBacklogStatus,
  bulkUploadWhitelist,
  getWhitelist,
  deleteWhitelistEntry,
  runBatchGraduationMigration,
} from "../controllers/adminController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";

const adminRouter = express.Router();

// All admin routes require authentication and admin / master_admin role
adminRouter.use(authMiddleware);
adminRouter.use(requireRole("admin", "master_admin"));

adminRouter.get("/users", getAllUsers);
adminRouter.patch("/users/:id/role", updateUserRole);
adminRouter.patch("/users/:id/status", toggleUserStatus);
adminRouter.patch("/users/:id/backlog", toggleBacklogStatus);

adminRouter.get("/whitelist", getWhitelist);
adminRouter.post("/whitelist/bulk", bulkUploadWhitelist);
adminRouter.delete("/whitelist/:id", deleteWhitelistEntry);

adminRouter.post("/graduate-batch", runBatchGraduationMigration);

export default adminRouter;
