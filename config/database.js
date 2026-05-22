import mongoose from "mongoose";
import "dotenv/config";
mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
    console.log('Database connected');
})
    .catch((err) => {
    console.log(err.message);
    process.exit(1);
});
//# sourceMappingURL=database.js.map