import { Schema, model, models } from "mongoose";

export interface ISearchEvent {
  query: string;
  resultsCount: number;
  userId?: string;
  createdAt: string;
}

const searchEventSchema = new Schema<ISearchEvent>(
  {
    query: { type: String, required: true },
    resultsCount: { type: Number, required: true, default: 0 },
    userId: { type: String },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
);

searchEventSchema.index({ createdAt: -1 });
searchEventSchema.index({ query: 1 });

export const SearchEventModel = models.SearchEvent ?? model<ISearchEvent>("SearchEvent", searchEventSchema);
