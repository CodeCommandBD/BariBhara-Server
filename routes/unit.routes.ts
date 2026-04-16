import express from "express";
import passport from "passport";
import { createUnit, getUnitsByProperty } from "../controller/unit.controller.js";

const unitRouter = express.Router();

// ৩. নতুন ইউনিট (ফ্ল্যাট/রুম) অ্যাড করার রাস্তা
unitRouter.post(
  "/add-unit",
  passport.authenticate("jwt", { session: false }),
  createUnit
);

unitRouter.get(
  "/:propertyId", // ইউআরএল-এ প্রপার্টি আইডি দিলে ওই বাড়ির সব ইউনিট চলে আসবে
  passport.authenticate("jwt", { session: false }),
  getUnitsByProperty
);
export default unitRouter;
