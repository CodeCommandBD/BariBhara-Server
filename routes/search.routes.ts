import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { globalSearch } from "../controller/search.controller.js";

const searchRouter = express.Router();

// গ্লোবাল সার্চ
searchRouter.get("/", isAuthenticated, globalSearch);

export default searchRouter;
