import express from "express";
import multer from "multer";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { uploadDocument, getDocuments, deleteDocument, generateLeasePDF } from "../controller/document.controller.js";

// Memory storage — Cloudinary-তে সরাসরি stream করবো
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("শুধু JPG, PNG, WebP এবং PDF ফাইল অনুমোদিত"));
  },
});

const documentRouter = express.Router();

documentRouter.get("/:tenantId", isAuthenticated, getDocuments);
documentRouter.post("/:tenantId/upload", isAuthenticated, upload.single("file"), uploadDocument);
documentRouter.delete("/:tenantId/:publicId", isAuthenticated, deleteDocument);
documentRouter.get("/:tenantId/lease-pdf", isAuthenticated, generateLeasePDF);

export default documentRouter;
