import { Server } from "socket.io";
export declare const initSocket: (server: any) => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
/**
 * রিয়েল-টাইম নোটিফিকেশন পাঠানোর ফাংশন
 */
export declare const sendNotification: (data: {
    recipient: string;
    title: string;
    message: string;
    type: "payment" | "maintenance" | "system" | "invoice";
    link?: string;
}) => Promise<(import("mongoose").Document<unknown, {}, {
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: import("mongoose").Types.ObjectId;
    isRead: boolean;
} & import("mongoose").DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: import("mongoose").Types.ObjectId;
    isRead: boolean;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}) | undefined>;
//# sourceMappingURL=socket.service.d.ts.map