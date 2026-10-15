
const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Request title is required"],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Request description is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Plumbing",
        "Electrical",
        "Carpentry",
        "Cleaning",
        "Other",
      ],
    },

    building: {
      type: String,
      required: [true, "Building is required"],
      trim: true,
    },

    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Assigned",
        "In Progress",
        "Completed",
        "Rejected",
      ],
      default: "Pending",
    },

    assignedTo: {
      type: String,
      trim: true,
      default: null,
    },
    
// Store a history of important events associated with the maintenance request.
    activityHistory: [
      {
        action: {
        type: String,
        required: true,
      },
        details: {
        type: String,
        trim: true,
        default: "",
      },
    timestamp: {
      type: Date,
      default: Date.now,
      },
      },
    ],

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MaintenanceRequest",
  maintenanceRequestSchema
);
