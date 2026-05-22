import mongoose from "mongoose";
declare const Transaction: mongoose.Model<{
    tenant: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    invoice: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: "Cash" | "Bkash" | "Nagad" | "Bank" | "Other";
    paymentDate: NativeDate;
    transactionId?: string | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    tenant: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    invoice: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: "Cash" | "Bkash" | "Nagad" | "Bank" | "Other";
    paymentDate: NativeDate;
    transactionId?: string | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    tenant: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    invoice: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: "Cash" | "Bkash" | "Nagad" | "Bank" | "Other";
    paymentDate: NativeDate;
    transactionId?: string | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenant: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    invoice: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: "Cash" | "Bkash" | "Nagad" | "Bank" | "Other";
    paymentDate: NativeDate;
    transactionId?: string | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    tenant: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    invoice: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: "Cash" | "Bkash" | "Nagad" | "Bank" | "Other";
    paymentDate: NativeDate;
    transactionId?: string | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    tenant: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    invoice: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: "Cash" | "Bkash" | "Nagad" | "Bank" | "Other";
    paymentDate: NativeDate;
    transactionId?: string | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    tenant: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    invoice: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: "Cash" | "Bkash" | "Nagad" | "Bank" | "Other";
    paymentDate: NativeDate;
    transactionId?: string | null;
    note?: string | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    tenant: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    invoice: mongoose.Types.ObjectId;
    amount: number;
    paymentMethod: "Cash" | "Bkash" | "Nagad" | "Bank" | "Other";
    paymentDate: NativeDate;
    transactionId?: string | null;
    note?: string | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Transaction;
//# sourceMappingURL=transaction.model.d.ts.map