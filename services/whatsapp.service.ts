import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode";
import { Server } from "socket.io";

class WhatsAppService {
  private client: any = null;
  private qrDataURL: string | null = null;
  private status: "disconnected" | "connecting" | "connected" = "disconnected";
  private io: Server | null = null;

  constructor() {
    // Initialized in init()
  }

  public async init(io: Server) {
    if (this.client) return;
    this.io = io;
    
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    this.initializeEvents();
    console.log("🚀 Initializing WhatsApp Client...");
    await this.client.initialize();
  }

  private initializeEvents() {
    if (!this.client) return;

    this.client.on("qr", async (qr: string) => {
      console.log("📱 WhatsApp QR received");
      this.status = "connecting";
      try {
        this.qrDataURL = await qrcode.toDataURL(qr);
        if (this.io) {
          this.io.emit("whatsapp_qr", { qr: this.qrDataURL });
        }
      } catch (error) {
        console.error("❌ Failed to generate QR code", error);
      }
    });

    this.client.on("ready", () => {
      console.log("✅ WhatsApp Client is ready!");
      this.status = "connected";
      this.qrDataURL = null;
      if (this.io) {
        this.io.emit("whatsapp_status", { status: "connected" });
      }
    });

    this.client.on("disconnected", (reason: string) => {
      console.log("❌ WhatsApp Client disconnected:", reason);
      this.status = "disconnected";
      this.qrDataURL = null;
      if (this.io) {
        this.io.emit("whatsapp_status", { status: "disconnected", reason });
      }
    });

    this.client.on("auth_failure", (msg: string) => {
      console.error("❌ WhatsApp Authentication failure:", msg);
      this.status = "disconnected";
    });
  }

  public getStatus() {
    return {
      status: this.status,
      qr: this.qrDataURL,
    };
  }

  public async logout() {
    if (this.client && this.status === "connected") {
      await this.client.logout();
      this.status = "disconnected";
      this.qrDataURL = null;
      return true;
    }
    return false;
  }

  public async sendMessage(phoneNumber: string, message: string) {
    if (!this.client || this.status !== "connected") {
      console.warn("⚠️ WhatsApp is not connected. Cannot send message.");
      return false;
    }
    try {
      let formattedNumber = phoneNumber.replace(/[^0-9]/g, "");
      if (formattedNumber.length === 11 && formattedNumber.startsWith("01")) {
        formattedNumber = "88" + formattedNumber;
      }
      const chatId = `${formattedNumber}@c.us`;
      await this.client.sendMessage(chatId, message);
      console.log(`✉️ WhatsApp message sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to send WhatsApp message", error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
