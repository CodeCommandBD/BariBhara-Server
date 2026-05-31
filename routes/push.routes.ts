import express from "express";
import { subscribeToPush, unsubscribeFromPush, getVapidKey } from "../controller/push.controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.post("/subscribe", isAuthenticated, subscribeToPush);
router.post("/unsubscribe", isAuthenticated, unsubscribeFromPush);
router.get("/vapid-key", isAuthenticated, getVapidKey);

export default router;
