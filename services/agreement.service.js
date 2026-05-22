import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const generateAgreementPDF = async (data, terms) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", margin: 50 });
            // আপনার সেভ করা কালপুরুষ ফন্ট পাথ
            const bengaliFontPath = path.resolve(__dirname, "../assets/fonts/kalpurush.ttf");
            let fontAvailable = false;
            // ফন্ট রেজিস্টার করা
            try {
                if (fs.existsSync(bengaliFontPath)) {
                    doc.registerFont("Kalpurush", bengaliFontPath);
                    fontAvailable = true;
                    doc.font("Kalpurush");
                }
            }
            catch (e) {
                console.error("Font Error:", e);
            }
            const writeText = (text, size = 12, options = {}) => {
                const isBengali = /[\u0980-\u09FF]/.test(text);
                if (isBengali && fontAvailable) {
                    doc.font("Kalpurush").fontSize(size).text(text, options);
                }
                else {
                    doc.font("Helvetica").fontSize(size).text(text, options);
                }
            };
            const chunks = [];
            const stream = new PassThrough();
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("end", async () => {
                const buffer = Buffer.concat(chunks);
                try {
                    const uploadResult = await new Promise((res, rej) => {
                        const cloudStream = cloudinary.uploader.upload_stream({
                            resource_type: "image",
                            folder: "agreements",
                            public_id: `agreement_${Date.now()}`,
                            format: "pdf",
                            type: "upload",
                        }, (error, result) => {
                            if (error)
                                rej(error);
                            else
                                res(result?.secure_url);
                        });
                        cloudStream.end(buffer);
                    });
                    resolve(uploadResult);
                }
                catch (err) {
                    reject(err);
                }
            });
            stream.on("error", reject);
            doc.pipe(stream);
            // কন্টেন্ট রেন্ডারিং
            if (fontAvailable)
                doc.font("Kalpurush");
            doc.fontSize(25).text("ভাড়া চুক্তিপত্র", { align: "center", underline: true });
            doc.moveDown();
            doc.fontSize(12).text(`তারিখ: ${new Date().toLocaleDateString("bn-BD")}`, { align: "right" });
            doc.moveDown();
            doc.fontSize(16).text("চুক্তির পক্ষগণ:", { underline: true });
            writeText(`বাড়িওয়ালা: ${data.landlordName || "মালিক"}`);
            writeText(`ভাড়াটিয়া: ${data.tenantName || "ভাড়াটিয়া"}`);
            doc.moveDown();
            doc.fontSize(16).text("প্রপার্টির বিবরণ:", { underline: true });
            writeText(`প্রপার্টির নাম: ${data.propertyName}`);
            writeText(`ইউনিট/ফ্ল্যাট: ${data.unitName}`);
            doc.moveDown();
            doc.fontSize(16).text("ভাড়ার শর্তাবলী:", { underline: true });
            writeText(`মাসিক ভাড়া: ${data.rentAmount || 0} টাকা`);
            writeText(`চুক্তি শুরুর তারিখ: ${data.startDate ? new Date(data.startDate).toLocaleDateString("bn-BD") : "N/A"}`);
            writeText(`চুক্তি শেষের ধরণ: ${data.endDate === "Auto-renew" ? "স্বয়ংক্রিয় নবায়ন" : data.endDate}`);
            doc.moveDown();
            doc.fontSize(16).text("সাধারণ শর্তাবলী:", { underline: true });
            writeText(terms || "কোনো শর্তাবলী উল্লেখ করা হয়নি।", 11, { align: "justify" });
            doc.moveDown(2);
            const currentY = doc.y;
            doc.fontSize(12).text("------------------------------------------", 50, currentY);
            doc.text("বাড়িওয়ালার স্বাক্ষর", 50, currentY + 15);
            doc.text("------------------------------------------", 350, currentY);
            doc.text("ভাড়াটিয়ার স্বাক্ষর (ডিজিটাল)", 350, currentY + 15);
            doc.end();
        }
        catch (err) {
            console.error("PDF Fatal Error:", err);
            reject(err);
        }
    });
};
//# sourceMappingURL=agreement.service.js.map