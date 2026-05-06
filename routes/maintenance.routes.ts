import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  getAllMaintenance,
  createMaintenance,
  updateMaintenanceStatus,
  deleteMaintenance,
} from "../controller/maintenance.controller.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createMaintenanceSchema, updateMaintenanceStatusSchema } from "../middleware/validate.js";

const maintenanceRouter = express.Router();

// সব রিকোয়েস্ট লিস্ট
maintenanceRouter.get("/", isAuthenticated, getAllMaintenance);

// নতুন রিকোয়েস্ট — ভ্যালিডেশন সহ
maintenanceRouter.post("/", isAuthenticated, validate(createMaintenanceSchema), createMaintenance);

// স্ট্যাটাস আপডেট — ভ্যালিডেশন সহ
maintenanceRouter.patch("/:id/status", isAuthenticated, validate(updateMaintenanceStatusSchema), updateMaintenanceStatus);

// ডিলিট
maintenanceRouter.delete("/:id", isAuthenticated, deleteMaintenance);

export default maintenanceRouter;
