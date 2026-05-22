import mongoose from "mongoose";
declare const Unit: mongoose.Model<{
    type: "ফ্ল্যাট" | "রুম" | "সিট" | "দোকান";
    createdAt: NativeDate;
    property: mongoose.Types.ObjectId;
    status: "খালি" | "ভাড়া হয়েছে" | "মেরামত চলছে";
    unitName: string;
    floor: number;
    rent: number;
    currentTenant?: mongoose.Types.ObjectId | null;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    type: "ফ্ল্যাট" | "রুম" | "সিট" | "দোকান";
    createdAt: NativeDate;
    property: mongoose.Types.ObjectId;
    status: "খালি" | "ভাড়া হয়েছে" | "মেরামত চলছে";
    unitName: string;
    floor: number;
    rent: number;
    currentTenant?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    type: "ফ্ল্যাট" | "রুম" | "সিট" | "দোকান";
    createdAt: NativeDate;
    property: mongoose.Types.ObjectId;
    status: "খালি" | "ভাড়া হয়েছে" | "মেরামত চলছে";
    unitName: string;
    floor: number;
    rent: number;
    currentTenant?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    type: "ফ্ল্যাট" | "রুম" | "সিট" | "দোকান";
    createdAt: NativeDate;
    property: mongoose.Types.ObjectId;
    status: "খালি" | "ভাড়া হয়েছে" | "মেরামত চলছে";
    unitName: string;
    floor: number;
    rent: number;
    currentTenant?: mongoose.Types.ObjectId | null;
}, mongoose.Document<unknown, {}, {
    type: "ফ্ল্যাট" | "রুম" | "সিট" | "দোকান";
    createdAt: NativeDate;
    property: mongoose.Types.ObjectId;
    status: "খালি" | "ভাড়া হয়েছে" | "মেরামত চলছে";
    unitName: string;
    floor: number;
    rent: number;
    currentTenant?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    type: "ফ্ল্যাট" | "রুম" | "সিট" | "দোকান";
    createdAt: NativeDate;
    property: mongoose.Types.ObjectId;
    status: "খালি" | "ভাড়া হয়েছে" | "মেরামত চলছে";
    unitName: string;
    floor: number;
    rent: number;
    currentTenant?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    type: "ফ্ল্যাট" | "রুম" | "সিট" | "দোকান";
    createdAt: NativeDate;
    property: mongoose.Types.ObjectId;
    status: "খালি" | "ভাড়া হয়েছে" | "মেরামত চলছে";
    unitName: string;
    floor: number;
    rent: number;
    currentTenant?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    type: "ফ্ল্যাট" | "রুম" | "সিট" | "দোকান";
    createdAt: NativeDate;
    property: mongoose.Types.ObjectId;
    status: "খালি" | "ভাড়া হয়েছে" | "মেরামত চলছে";
    unitName: string;
    floor: number;
    rent: number;
    currentTenant?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Unit;
//# sourceMappingURL=unit.model.d.ts.map