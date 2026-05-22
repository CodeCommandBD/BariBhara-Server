import mongoose from "mongoose";
declare const Notification: mongoose.Model<{
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: mongoose.Types.ObjectId;
    isRead: boolean;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    type: "invoice" | "payment" | "maintenance" | "system";
    link: string;
    message: string;
    title: string;
    recipient: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Notification;
//# sourceMappingURL=notification.model.d.ts.map