import mongoose from "mongoose";
import "dotenv/config";

mongoose.connect(process.env.MONGODB_URI as string)
    .then(() => {
        console.log('Database connected');
    })
    .catch((err) => {
        console.log(err.message);
        process.exit(1);
    });