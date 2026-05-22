import mongoose from "mongoose";
declare const Property: mongoose.Model<{
    name: string;
    createdAt: NativeDate;
    owner: mongoose.Types.ObjectId;
    location: string;
    totalFloors: number;
    images: string[];
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    name: string;
    createdAt: NativeDate;
    owner: mongoose.Types.ObjectId;
    location: string;
    totalFloors: number;
    images: string[];
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    name: string;
    createdAt: NativeDate;
    owner: mongoose.Types.ObjectId;
    location: string;
    totalFloors: number;
    images: string[];
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    createdAt: NativeDate;
    owner: mongoose.Types.ObjectId;
    location: string;
    totalFloors: number;
    images: string[];
}, mongoose.Document<unknown, {}, {
    name: string;
    createdAt: NativeDate;
    owner: mongoose.Types.ObjectId;
    location: string;
    totalFloors: number;
    images: string[];
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    name: string;
    createdAt: NativeDate;
    owner: mongoose.Types.ObjectId;
    location: string;
    totalFloors: number;
    images: string[];
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    name: string;
    createdAt: NativeDate;
    owner: mongoose.Types.ObjectId;
    location: string;
    totalFloors: number;
    images: string[];
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    name: string;
    createdAt: NativeDate;
    owner: mongoose.Types.ObjectId;
    location: string;
    totalFloors: number;
    images: string[];
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Property;
//# sourceMappingURL=property.model.d.ts.map