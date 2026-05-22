import mongoose from "mongoose";
declare const User: mongoose.Model<{
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "tenant" | "landlord";
    photo: string;
    bio: string;
    twoFactorEnabled: boolean;
    trustedDevices: string[];
    agreementTemplate: string;
    createdAt: NativeDate;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "tenant" | "landlord";
    photo: string;
    bio: string;
    twoFactorEnabled: boolean;
    trustedDevices: string[];
    agreementTemplate: string;
    createdAt: NativeDate;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "tenant" | "landlord";
    photo: string;
    bio: string;
    twoFactorEnabled: boolean;
    trustedDevices: string[];
    agreementTemplate: string;
    createdAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "tenant" | "landlord";
    photo: string;
    bio: string;
    twoFactorEnabled: boolean;
    trustedDevices: string[];
    agreementTemplate: string;
    createdAt: NativeDate;
}, mongoose.Document<unknown, {}, {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "tenant" | "landlord";
    photo: string;
    bio: string;
    twoFactorEnabled: boolean;
    trustedDevices: string[];
    agreementTemplate: string;
    createdAt: NativeDate;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "tenant" | "landlord";
    photo: string;
    bio: string;
    twoFactorEnabled: boolean;
    trustedDevices: string[];
    agreementTemplate: string;
    createdAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "tenant" | "landlord";
    photo: string;
    bio: string;
    twoFactorEnabled: boolean;
    trustedDevices: string[];
    agreementTemplate: string;
    createdAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "tenant" | "landlord";
    photo: string;
    bio: string;
    twoFactorEnabled: boolean;
    trustedDevices: string[];
    agreementTemplate: string;
    createdAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default User;
//# sourceMappingURL=user.model.d.ts.map