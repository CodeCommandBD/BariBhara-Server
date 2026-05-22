export interface InvoicePDFData {
    invoiceNumber: string;
    tenantName: string;
    tenantPhone: string;
    propertyName: string;
    unitName: string;
    month: string;
    year: number;
    paymentDate: Date;
    paymentMethod: string;
    transactionId?: string;
    baseRent: number;
    waterBill: number;
    gasBill: number;
    electricityBill: number;
    serviceCharge: number;
    otherBill: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    ownerName: string;
    status: "Paid" | "Partial" | "Unpaid";
}
export declare const generateInvoicePDF: (data: InvoicePDFData) => Promise<Buffer>;
export declare const generateInvoiceNumber: (invoiceId: string) => string;
//# sourceMappingURL=pdf.service.d.ts.map