import { Schema, model, models } from "mongoose";

export type CustomerNoteDoc = {
  _id: string;
  userId: string;
  note: string;
  createdBy: string;
  createdAt: string;
};

const schema = new Schema<CustomerNoteDoc>(
  {
    userId: { type: String, required: true, index: true },
    note: { type: String, required: true, maxlength: 1000 },
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const CustomerNoteModel =
  models.CustomerNote ?? model<CustomerNoteDoc>("CustomerNote", schema);
