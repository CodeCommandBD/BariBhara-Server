import mongoose from "mongoose";
declare const Tenant: mongoose.Model<{
    name: string;
    email: string;
    phone: string;
    photo: string;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    portalEnabled: boolean;
    rentAmount: number;
    advanceAmount: number;
    leaseStart: NativeDate;
    autoRenew: boolean;
    renewalMonths: number;
    documents: mongoose.Types.DocumentArray<{
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, {}, {}> & {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }>;
    status: "সক্রিয়" | "চলে গেছে";
    nid?: string | null;
    portalPassword?: string | null;
    leaseEnd?: NativeDate | null;
    agreement?: {
        isSigned: boolean;
        pdfUrl?: string | null;
        signatureUrl?: string | null;
        signedAt?: NativeDate | null;
    } | null;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    name: string;
    email: string;
    phone: string;
    photo: string;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    portalEnabled: boolean;
    rentAmount: number;
    advanceAmount: number;
    leaseStart: NativeDate;
    autoRenew: boolean;
    renewalMonths: number;
    documents: mongoose.Types.DocumentArray<{
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, {}, {}> & {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }>;
    status: "সক্রিয়" | "চলে গেছে";
    nid?: string | null;
    portalPassword?: string | null;
    leaseEnd?: NativeDate | null;
    agreement?: {
        isSigned: boolean;
        pdfUrl?: string | null;
        signatureUrl?: string | null;
        signedAt?: NativeDate | null;
    } | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    name: string;
    email: string;
    phone: string;
    photo: string;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    portalEnabled: boolean;
    rentAmount: number;
    advanceAmount: number;
    leaseStart: NativeDate;
    autoRenew: boolean;
    renewalMonths: number;
    documents: mongoose.Types.DocumentArray<{
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, {}, {}> & {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }>;
    status: "সক্রিয়" | "চলে গেছে";
    nid?: string | null;
    portalPassword?: string | null;
    leaseEnd?: NativeDate | null;
    agreement?: {
        isSigned: boolean;
        pdfUrl?: string | null;
        signatureUrl?: string | null;
        signedAt?: NativeDate | null;
    } | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    email: string;
    phone: string;
    photo: string;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    portalEnabled: boolean;
    rentAmount: number;
    advanceAmount: number;
    leaseStart: NativeDate;
    autoRenew: boolean;
    renewalMonths: number;
    documents: mongoose.Types.DocumentArray<{
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, {}, {}> & {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }>;
    status: "সক্রিয়" | "চলে গেছে";
    nid?: string | null;
    portalPassword?: string | null;
    leaseEnd?: NativeDate | null;
    agreement?: {
        isSigned: boolean;
        pdfUrl?: string | null;
        signatureUrl?: string | null;
        signedAt?: NativeDate | null;
    } | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    name: string;
    email: string;
    phone: string;
    photo: string;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    portalEnabled: boolean;
    rentAmount: number;
    advanceAmount: number;
    leaseStart: NativeDate;
    autoRenew: boolean;
    renewalMonths: number;
    documents: mongoose.Types.DocumentArray<{
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, {}, {}> & {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }>;
    status: "সক্রিয়" | "চলে গেছে";
    nid?: string | null;
    portalPassword?: string | null;
    leaseEnd?: NativeDate | null;
    agreement?: {
        isSigned: boolean;
        pdfUrl?: string | null;
        signatureUrl?: string | null;
        signedAt?: NativeDate | null;
    } | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    name: string;
    email: string;
    phone: string;
    photo: string;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    portalEnabled: boolean;
    rentAmount: number;
    advanceAmount: number;
    leaseStart: NativeDate;
    autoRenew: boolean;
    renewalMonths: number;
    documents: mongoose.Types.DocumentArray<{
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, {}, {}> & {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }>;
    status: "সক্রিয়" | "চলে গেছে";
    nid?: string | null;
    portalPassword?: string | null;
    leaseEnd?: NativeDate | null;
    agreement?: {
        isSigned: boolean;
        pdfUrl?: string | null;
        signatureUrl?: string | null;
        signedAt?: NativeDate | null;
    } | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    name: string;
    email: string;
    phone: string;
    photo: string;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    portalEnabled: boolean;
    rentAmount: number;
    advanceAmount: number;
    leaseStart: NativeDate;
    autoRenew: boolean;
    renewalMonths: number;
    documents: mongoose.Types.DocumentArray<{
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, {}, {}> & {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }>;
    status: "সক্রিয়" | "চলে গেছে";
    nid?: string | null;
    portalPassword?: string | null;
    leaseEnd?: NativeDate | null;
    agreement?: {
        isSigned: boolean;
        pdfUrl?: string | null;
        signatureUrl?: string | null;
        signedAt?: NativeDate | null;
    } | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    name: string;
    email: string;
    phone: string;
    photo: string;
    unit: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    portalEnabled: boolean;
    rentAmount: number;
    advanceAmount: number;
    leaseStart: NativeDate;
    autoRenew: boolean;
    renewalMonths: number;
    documents: mongoose.Types.DocumentArray<{
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }, {}, {}> & {
        type: "photo" | "nid" | "contract" | "other";
        url: string;
        publicId: string;
        uploadedAt: NativeDate;
    }>;
    status: "সক্রিয়" | "চলে গেছে";
    nid?: string | null;
    portalPassword?: string | null;
    leaseEnd?: NativeDate | null;
    agreement?: {
        isSigned: boolean;
        pdfUrl?: string | null;
        signatureUrl?: string | null;
        signedAt?: NativeDate | null;
    } | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Tenant;
//# sourceMappingURL=tenant.model.d.ts.map