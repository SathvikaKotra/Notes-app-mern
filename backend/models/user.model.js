import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
