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


app.get("/api/requests", async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error retrieving requests:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve maintenance requests.",
    });
  }
});


startServer();
