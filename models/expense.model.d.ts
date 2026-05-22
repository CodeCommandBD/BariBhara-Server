import mongoose from "mongoose";
declare const Expense: mongoose.Model<{
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    amount: number;
    title: string;
    category: "মেরামত" | "রক্ষণাবেক্ষণ" | "পরিষ্কার" | "ইলেকট্রিক্যাল" | "প্লাম্বিং" | "অন্যান্য";
    expenseDate: NativeDate;
    unit?: mongoose.Types.ObjectId | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    amount: number;
    title: string;
    category: "মেরামত" | "রক্ষণাবেক্ষণ" | "পরিষ্কার" | "ইলেকট্রিক্যাল" | "প্লাম্বিং" | "অন্যান্য";
    expenseDate: NativeDate;
    unit?: mongoose.Types.ObjectId | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    amount: number;
    title: string;
    category: "মেরামত" | "রক্ষণাবেক্ষণ" | "পরিষ্কার" | "ইলেকট্রিক্যাল" | "প্লাম্বিং" | "অন্যান্য";
    expenseDate: NativeDate;
    unit?: mongoose.Types.ObjectId | null;
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
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    amount: number;
    title: string;
    category: "মেরামত" | "রক্ষণাবেক্ষণ" | "পরিষ্কার" | "ইলেকট্রিক্যাল" | "প্লাম্বিং" | "অন্যান্য";
    expenseDate: NativeDate;
    unit?: mongoose.Types.ObjectId | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    amount: number;
    title: string;
    category: "মেরামত" | "রক্ষণাবেক্ষণ" | "পরিষ্কার" | "ইলেকট্রিক্যাল" | "প্লাম্বিং" | "অন্যান্য";
    expenseDate: NativeDate;
    unit?: mongoose.Types.ObjectId | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    amount: number;
    title: string;
    category: "মেরামত" | "রক্ষণাবেক্ষণ" | "পরিষ্কার" | "ইলেকট্রিক্যাল" | "প্লাম্বিং" | "অন্যান্য";
    expenseDate: NativeDate;
    unit?: mongoose.Types.ObjectId | null;
    note?: string | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    amount: number;
    title: string;
    category: "মেরামত" | "রক্ষণাবেক্ষণ" | "পরিষ্কার" | "ইলেকট্রিক্যাল" | "প্লাম্বিং" | "অন্যান্য";
    expenseDate: NativeDate;
    unit?: mongoose.Types.ObjectId | null;
    note?: string | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    amount: number;
    title: string;
    category: "মেরামত" | "রক্ষণাবেক্ষণ" | "পরিষ্কার" | "ইলেকট্রিক্যাল" | "প্লাম্বিং" | "অন্যান্য";
    expenseDate: NativeDate;
    unit?: mongoose.Types.ObjectId | null;
    note?: string | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Expense;
//# sourceMappingURL=expense.model.d.ts.map