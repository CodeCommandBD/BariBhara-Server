import multer  from "multer";
import { storage } from "../config/cloudinary.js";


// ৩. মাল্টার মাধ্যমে আসল আপলোড টুল তৈরি
const upload = multer({
    storage: storage,
    limits:{
        fileSize: 1 * 1024 * 1024 
    }
})

export default upload