import mongoose from "mongoose";
declare const Invoice: mongoose.Model<{
    tenant: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    pdfUrl: string;
    status: "Unpaid" | "Partial" | "Paid";
    month: string;
    year: number;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate?: NativeDate | null;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    tenant: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    pdfUrl: string;
    status: "Unpaid" | "Partial" | "Paid";
    month: string;
    year: number;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate?: NativeDate | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    tenant: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    pdfUrl: string;
    status: "Unpaid" | "Partial" | "Paid";
    month: string;
    year: number;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate?: NativeDate | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    tenant: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    pdfUrl: string;
    status: "Unpaid" | "Partial" | "Paid";
    month: string;
    year: number;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate?: NativeDate | null;
}, mongoose.Document<unknown, {}, {
    tenant: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    pdfUrl: string;
    status: "Unpaid" | "Partial" | "Paid";
    month: string;
    year: number;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate?: NativeDate | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    tenant: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    pdfUrl: string;
    status: "Unpaid" | "Partial" | "Paid";
    month: string;
    year: number;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate?: NativeDate | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    tenant: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    pdfUrl: string;
    status: "Unpaid" | "Partial" | "Paid";
    month: string;
    year: number;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate?: NativeDate | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    tenant: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    pdfUrl: string;
    status: "Unpaid" | "Partial" | "Paid";
    month: string;
    year: number;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate?: NativeDate | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Invoice;
//# sourceMappingURL=invoice.model.d.ts.map