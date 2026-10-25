import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    daysAllowed: {
      type: Number,
      required: true,
      default: 12,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);
export default LeaveType;
