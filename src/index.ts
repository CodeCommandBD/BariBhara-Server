import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { initSocket } from "../services/socket.service.js";
import { startCronJobs } from "../services/cron.service.js";

const PORT = process.env.PORT || 4000;

// ১. Express app কে HTTP Server এ wrap করা (Socket.io এর জন্য)
const httpServer = createServer(app);

// ২. Socket.io initialize করা
initSocket(httpServer);

// ৩. HTTP Server চালু করা
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready`);
  // Cron jobs শুরু করা
  startCronJobs();
});
