import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: false,
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  googleId: {
    type: String,
  },
  name: {
    type: String,
  },
  avatar: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

const RequestHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  request: {
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
  },
  response: {
    status: Number,
    statusText: String,
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
  },
});

export const RequestHistory =
  mongoose.models.RequestHistory ||
  mongoose.model("RequestHistory", RequestHistorySchema);
