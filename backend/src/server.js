
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

startServer();
