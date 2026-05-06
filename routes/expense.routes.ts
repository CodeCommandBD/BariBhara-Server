import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { addExpense, getExpenses, deleteExpense } from "../controller/expense.controller.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createExpenseSchema } from "../middleware/validate.js";

const expenseRouter = express.Router();

// ১. খরচ যোগ করা — ভ্যালিডেশন সহ
expenseRouter.post("/add", isAuthenticated, validate(createExpenseSchema), addExpense);

// ২. সব খরচ দেখা (ফিল্টার সহ)
expenseRouter.get("/all", isAuthenticated, getExpenses);

// ৩. খরচ ডিলিট করা
expenseRouter.delete("/:id", isAuthenticated, deleteExpense);

export default expenseRouter;
