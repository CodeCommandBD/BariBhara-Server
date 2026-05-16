import type { Request, Response } from "express";
import { whatsappService } from "../services/whatsapp.service.js";

export const getWhatsAppStatus = (req: Request, res: Response) => {
  try {
    const status = whatsappService.getStatus();
    res.status(200).json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutWhatsApp = async (req: Request, res: Response) => {
  try {
    const loggedOut = await whatsappService.logout();
    if (loggedOut) {
      res.status(200).json({ success: true, message: "WhatsApp logged out successfully." });
    } else {
      res.status(400).json({ success: false, message: "WhatsApp is not connected." });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendTestMessage = async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      res.status(400).json({ success: false, message: "Phone and message are required." });
      return;
    }
    const success = await whatsappService.sendMessage(phone, message);
    if (success) {
      res.status(200).json({ success: true, message: "Message sent successfully." });
    } else {
      res.status(500).json({ success: false, message: "Failed to send message. Is WhatsApp connected?" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
