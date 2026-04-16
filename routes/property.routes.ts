import { Router } from "express";
import passport from "passport";
import upload from "../middleware/upload.js"; // আমাদের বানানো ইমেজ আপলোডার
import {
  createProperty,
  getMyProperties,
} from "../controller/property.controller.js";

const propertyRouter: Router = Router();

// ১. বাড়ি অ্যাড করার রাস্তা (Route)
// এখানে 'upload.array("images", 5)' এর মানে হলো ইউজার একসাথে সর্বোচ্চ ৫টি ছবি দিতে পারবে
propertyRouter.post(
  "/add-property",
  passport.authenticate("jwt", { session: false }),
  upload.array("images", 5),
  createProperty,
);

// ২. বাড়িওয়ালার নিজের সব বাড়ির লিস্ট দেখার রাস্তা
propertyRouter.get(
  "/my-property",
  passport.authenticate("jwt", { session: false }),
  getMyProperties,
);

export default propertyRouter;
