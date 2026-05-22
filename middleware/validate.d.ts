import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        tenant: "tenant";
        landlord: "landlord";
        manager: "manager";
    }>>>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    deviceId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createPropertySchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<{
        Apartment: "Apartment";
        House: "House";
        Commercial: "Commercial";
        Land: "Land";
    }>>;
    totalUnits: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createTenantSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    nid: z.ZodOptional<z.ZodString>;
    property: z.ZodString;
    unit: z.ZodString;
    rentAmount: z.ZodCoercedNumber<unknown>;
    leaseStart: z.ZodString;
    leaseEnd: z.ZodString;
}, z.core.$strip>;
export declare const createExpenseSchema: z.ZodObject<{
    property: z.ZodString;
    title: z.ZodString;
    category: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        মেরামত: "মেরামত";
        রক্ষণাবেক্ষণ: "রক্ষণাবেক্ষণ";
        পরিষ্কার: "পরিষ্কার";
        ইলেকট্রিক্যাল: "ইলেকট্রিক্যাল";
        প্লাম্বিং: "প্লাম্বিং";
        অন্যান্য: "অন্যান্য";
    }>>>;
    amount: z.ZodCoercedNumber<unknown>;
    expenseDate: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createMaintenanceSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    property: z.ZodString;
    unit: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        Low: "Low";
        Medium: "Medium";
        High: "High";
    }>>>;
    cost: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    reportedDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateMaintenanceStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        Pending: "Pending";
        "In Progress": "In Progress";
        Resolved: "Resolved";
    }>;
    cost: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const collectRentSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    amount: z.ZodCoercedNumber<unknown>;
    paymentDate: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodEnum<{
        Cash: "Cash";
        "Bank Transfer": "Bank Transfer";
        "Mobile Banking": "Mobile Banking";
        Cheque: "Cheque";
    }>>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=validate.d.ts.map