export declare const sendPaymentReceiptEmail: (data: {
    tenantEmail: string;
    tenantName: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    propertyName: string;
    unitName: string;
    month: string;
    year: number;
    paidDate: Date;
    remainingDue: number;
    pdfBuffer?: Buffer;
    invoiceNumber?: string;
}) => Promise<void>;
export declare const sendRentReminderEmail: (data: {
    tenantEmail: string;
    tenantName: string;
    dueAmount: number;
    propertyName: string;
    unitName: string;
    month: string;
    year: number;
}) => Promise<void>;
export declare const sendLeaseExpiryEmail: (data: {
    tenantEmail: string;
    tenantName: string;
    propertyName: string;
    unitName: string;
    leaseEnd: Date;
    daysLeft: number;
}) => Promise<void>;
//# sourceMappingURL=email.service.d.ts.map