import { Server } from "socket.io";
declare class WhatsAppService {
    private client;
    private qrDataURL;
    private status;
    private io;
    constructor();
    init(io: Server): Promise<void>;
    private initializeEvents;
    getStatus(): {
        status: "disconnected" | "connecting" | "connected";
        qr: string | null;
    };
    logout(): Promise<boolean>;
    sendMessage(phoneNumber: string, message: string): Promise<boolean>;
}
export declare const whatsappService: WhatsAppService;
export {};
//# sourceMappingURL=whatsapp.service.d.ts.map