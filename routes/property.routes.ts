import { Router } from "express";
import upload from "../middleware/upload.js"; // আমাদের বানানো ইমেজ আপলোডার
import {
  createProperty,
  getMyProperties,
  getPropertyDetail,
  updateProperty,
  deleteProperty,
} from "../controller/property.controller.js";

import { isAuthenticated } from "../middleware/isAuthenticated.js";

const propertyRouter: Router = Router();

// ১. বাড়ি অ্যাড করার রাস্তা (Route)
// এখানে 'upload.array("images", 5)' এর মানে হলো ইউজার একসাথে সর্বোচ্চ ৫টি ছবি দিতে পারবে
propertyRouter.post(
  "/add-property",
  isAuthenticated,
  upload.array("images", 5),
  createProperty,
);

// ২. বাড়িওয়ালার নিজের সব বাড়ির লিস্ট দেখার রাস্তা
propertyRouter.get(
  "/my-property",
  isAuthenticated,
  getMyProperties,
);

// ৩. একটি নির্দিষ্ট বাড়ির বিস্তারিত তথ্য দেখার রাস্তা
propertyRouter.get(
  "/:id",
  isAuthenticated,
  getPropertyDetail,
);
// ৪. প্রপার্টির তথ্য আপডেট করার রাস্তা
propertyRouter.put(
  "/:id", 
  isAuthenticated, 
  upload.array("images", 5), // যদি ইউজার ছবিও আপডেট করতে চান
  updateProperty
);

// ৫. প্রপার্টি ডিলিট করার রাস্তা
propertyRouter.delete(
  "/:id",
  isAuthenticated,
  deleteProperty
);

export default propertyRouter;
