import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { initSocket } from "../services/socket.service.js";
import { whatsappService } from "../services/whatsapp.service.js";
const PORT = process.env.PORT || 4000;
// ১. Express app কে HTTP Server এ wrap করা (Socket.io এর জন্য)
const httpServer = createServer(app);
// ২. Socket.io initialize করা
const io = initSocket(httpServer);
// ৩. WhatsApp Service initialize করা
whatsappService.init(io).catch((err) => console.error("WhatsApp Init Error:", err));
// ৪. HTTP Server চালু করা
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running → http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready`);
});
//# sourceMappingURL=index.js.map