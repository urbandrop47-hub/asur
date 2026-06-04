import { Schema, model, models } from "mongoose";

export type SizeChartRow = {
  size: string;
  chest: number;
  waist: number;
  hip: number;
  length: number;
};

export type ISizeChart = {
  category: string;           // unique key, e.g. "t-shirts", "hoodies", "default"
  unit: "cm" | "in";
  rows: SizeChartRow[];
  updatedAt: string;
};

const rowSchema = new Schema<SizeChartRow>(
  {
    size:   { type: String, required: true },
    chest:  { type: Number, required: true },
    waist:  { type: Number, required: true },
    hip:    { type: Number, required: true },
    length: { type: Number, required: true }
  },
  { _id: false }
);

const sizeChartSchema = new Schema<ISizeChart>(
  {
    category:  { type: String, required: true, unique: true, index: true },
    unit:      { type: String, enum: ["cm", "in"], default: "cm" },
    rows:      { type: [rowSchema], default: [] },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const SizeChartModel = models.SizeChart ?? model<ISizeChart>("SizeChart", sizeChartSchema);
