import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
    },
    // Office location for geo check-in (simple lat/lng + radius in meters)
    officeLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      radius: { type: Number, default: 200 }, // meters
    },
    // Working hours (simple)
    workStartTime: {
      type: String,
      default: "09:00", // HH:mm
    },
    workEndTime: {
      type: String,
      default: "18:00",
    },
    lateThresholdMinutes: {
      type: Number,
      default: 15, // after this many minutes considered late
    },
    // Currency / payroll settings
    currency: {
      type: String,
      default: "PKR",
    },
    isSetupComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);
export default Company;
