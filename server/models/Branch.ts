import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  name: string;
  address?: string;
  createdAt: Date;
}

const BranchSchema = new Schema<IBranch>({
  name: { type: String, required: true, unique: true },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBranch>("Branch", BranchSchema);