import "dotenv/config";
import app from "./app.js";
import { startCronJobs } from "../services/cron.service.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  // Cron jobs শুরু করা
  startCronJobs();
});

