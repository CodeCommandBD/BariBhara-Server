import mongoose, { Document } from "mongoose";
export interface IMaintenance extends Document {
    title: string;
    description: string;
    property: mongoose.Types.ObjectId;
    unit?: mongoose.Types.ObjectId;
    tenant?: mongoose.Types.ObjectId;
    status: "Pending" | "In Progress" | "Resolved";
    priority: "Low" | "Medium" | "High";
    reportedDate: Date;
    resolvedDate?: Date;
    cost?: number;
    owner: mongoose.Types.ObjectId;
}
declare const Maintenance: mongoose.Model<IMaintenance, {}, {}, {}, mongoose.Document<unknown, {}, IMaintenance, {}, mongoose.DefaultSchemaOptions> & IMaintenance & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMaintenance>;
export default Maintenance;
//# sourceMappingURL=maintenance.model.d.ts.map