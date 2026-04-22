import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  createUnit,
  getUnitsByProperty,
  updateUnit,
  deleteUnit,
} from "../controller/unit.controller.js";

const unitRouter = express.Router();

// নতুন ইউনিট (ফ্ল্যাট/রুম) অ্যাড করার রাস্তা
unitRouter.post(
  "/add-unit",
  isAuthenticated,
  createUnit
);

// একটি নির্দিষ্ট বাড়ির সব ইউনিট দেখার রাস্তা
unitRouter.get(
  "/:propertyId", // ইউআরএল-এ প্রপার্টি আইডি দিলে ওই বাড়ির সব ইউনিট চলে আসবে
  isAuthenticated,
  getUnitsByProperty
);

// ইউনিটের তথ্য আপডেট করার রাস্তা
unitRouter.put("/:unitId", isAuthenticated, updateUnit);

// ইউনিট ডিলিট করার রাস্তা
unitRouter.delete("/:unitId", isAuthenticated, deleteUnit);
export default unitRouter;
