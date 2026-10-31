import crypto from "node:crypto";
import mongoose from "mongoose";
import Case from "../models/Case.js";

const memoryCases = new Map();

export async function saveCase(caseData) {
  if (Case.db.readyState === 1) {
    const doc = await Case.create(caseData);
    return doc;
  }
  const stored = { ...caseData, _id: crypto.randomUUID() };
  memoryCases.set(stored._id, stored);
  return stored;
}

export async function findCase(id) {
  if (Case.db.readyState === 1) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Case.findById(id);
  }
  return memoryCases.get(id) ?? null;
}

export async function persistCase(caseRecord) {
  if (Case.db.readyState === 1) {
    await caseRecord.save();
  }
  return caseRecord;
}
