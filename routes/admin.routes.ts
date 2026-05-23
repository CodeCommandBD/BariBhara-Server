import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { getAdminStats, getAllUsers, updateUserStatus } from "../controller/admin.controller.js";

const router = express.Router();

// All admin routes must be authenticated and have admin role
router.use(isAuthenticated, isAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.post("/users/:id/status", updateUserStatus);

export default router;
