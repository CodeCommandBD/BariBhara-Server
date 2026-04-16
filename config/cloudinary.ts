import {v2 as cloudinary} from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import "dotenv/config"

// ১. ক্লাউডিনারির সাথে আপনার সার্ভারের কানেকশন
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
})


// ২. ছবিগুলো কোথায় এবং কীভাবে সেভ হবে তার নিয়ম (Storage Rules)

export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params:{
        folder: "bari-bhara/properties",
        allowed_formate: ['jpg', 'png', 'jpeg', 'svg']
    } as any
})