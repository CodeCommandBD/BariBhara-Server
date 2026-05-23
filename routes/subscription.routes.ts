import express from "express";
import { 
    approveSubscription, 
    createSubscriptionRequest, 
    getAllSubscriptions, 
    rejectSubscription,
    getMyLatestSubscription,
    activateFreePlan
} from "../controller/subscription.controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public/User routes
router.post("/create", isAuthenticated, upload.single("screenshot"), createSubscriptionRequest);
router.post("/activate-free", isAuthenticated, activateFreePlan);
router.get("/my-latest", isAuthenticated, getMyLatestSubscription);

// Admin routes (Consider adding an isAdmin middleware later)
router.get("/all", isAuthenticated, getAllSubscriptions);
router.post("/:id/approve", isAuthenticated, approveSubscription);
router.post("/:id/reject", isAuthenticated, rejectSubscription);

export default router;
