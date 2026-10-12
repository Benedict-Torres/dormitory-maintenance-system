const MaintenanceRequest = require("./models/MaintenanceRequest");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Dormitory Maintenance API is working!" });
});

// Start the server only after MongoDB connects
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

app.get("/api/test", (req, res) => {
  res.json({ message: "Dormitory Maintenance API is working!" });
});

// Add the new POST endpoint below the test endpoint
app.post("/api/requests", async (req, res) => {
  try {
    const request = await MaintenanceRequest.create(req.body);

    return res.status(201).json({
      message: "Maintenance request created successfully!",
      request,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid maintenance request data.",
        errors: error.message,
      });
    }

    console.error("Error creating request:", error.message);

    return res.status(500).json({
      message: "Failed to create maintenance request.",
    });
  }
});

// Retrieve maintenance requests from MongoDB with optional status and category filters.
app.get("/api/requests", async (req, res) => {
  try {
    const { status, category } = req.query;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Completed",
    ];

    // Keep these values consistent with the MaintenanceRequest schema.
    const allowedCategories = [
      "Plumbing",
      "Electrical",
      "Carpentry",
      "Cleaning",
      "Other",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status filter.",
        allowedStatuses,
      });
    }

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category filter.",
        allowedCategories,
      });
    }

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    const requests = await MaintenanceRequest.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error retrieving maintenance requests:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve maintenance requests.",
    });
  }
});

// Retrieve one maintenance request from MongoDB using its ID.
app.get("/api/requests/:id", async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Maintenance request not found.",
      });
    }

    return res.status(200).json({ request });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid maintenance request ID.",
      });
    }

    console.error("Error retrieving maintenance request:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve maintenance request.",
    });
  }
});

// Update the status of an existing maintenance request in MongoDB.
app.patch("/api/requests/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use Pending, In Progress, or Completed.",
      });
    }

    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after", runValidators: true }
    );

    if (!request) {
      return res.status(404).json({
        message: "Maintenance request not found.",
      });
    }

    return res.status(200).json({
      message: "Maintenance request status updated successfully!",
      request,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid maintenance request ID.",
      });
    }

    console.error("Error updating request status:", error.message);

    return res.status(500).json({
      message: "Failed to update maintenance request status.",
    });
  }
});


startServer();
