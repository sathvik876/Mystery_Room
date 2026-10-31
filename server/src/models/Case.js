import mongoose from "mongoose";

const CaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  premise: { type: String, required: true },
  story: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  suspects: { type: [mongoose.Schema.Types.Mixed], required: true },
  clues: { type: [mongoose.Schema.Types.Mixed], required: true },
  hints: { type: [String], required: true },
  solution: {
    culpritId: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  progress: {
    discoveredClueIds: { type: [String], default: [] },
    hintsUsed: { type: Number, default: 0 },
    accusation: { type: String, default: null },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
  },
}, { timestamps: true });

export default mongoose.models.Case || mongoose.model("Case", CaseSchema);
