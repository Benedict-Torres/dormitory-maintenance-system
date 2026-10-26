const mongoose = require("mongoose");

// Define the structure and validation rules for user accounts.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
    },
    role: {
      type: String,
      enum: ["Resident", "Admin", "Maintenance"],
      default: "Resident",
    },
    // Maintenance employees can be assigned only to categories they support.
    maintenanceCategories: {
      type: [
        {
          type: String,
          enum: [
            "Plumbing",
            "Electrical",
            "Carpentry",
            "Cleaning",
            "Other",
         ],
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Export the model so authentication routes can access user records.
module.exports = mongoose.model("User", userSchema);
