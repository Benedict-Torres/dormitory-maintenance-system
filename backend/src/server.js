const MaintenanceRequest = require("./models/MaintenanceRequest");
require("dotenv").config();
// Import the user model and password-hashing library for registration.
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const maintenanceTeam = require("./data/maintenanceTeam");

const app = express();

app.use(cors());
app.use(express.json());

/**
 * Verify the JWT supplied in the Authorization header.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required. Please log in.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication token is missing.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");
    return res.status(500).json({
      message: "Server authentication is not configured.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({
        message: "Invalid or expired authentication token.",
      });
    }

    req.user = decoded;
    next();
  });
}
// Allow only Admin users to access the route.
function requireAdmin(req, res, next) {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
}

// Allow only authenticated users with one of the specified roles.
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
}

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Dormitory Maintenance API is working!" });
});

app.get("/api/maintenance-team", authenticateToken, (req, res) => {
  res.status(200).json({
    count: maintenanceTeam.length,
    employees: maintenanceTeam,
  });
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
app.post("/api/requests", authenticateToken, async (req, res) => {
  try {
    const { title, description, category, building, roomNumber, priority } = req.body || {};

    // Build request data from permitted fields only; never trust client-supplied ownership or status.
    const requestData = {
      title,
      description,
      category,
      building,
      roomNumber,
      priority,
      status: "Pending",
      activityHistory: [{
        action: "Request Submitted",
        details: "Maintenance request submitted through DormCare.",
        timestamp: new Date(),
      }],
    };

    // The authenticated token determines ownership for residents.
    if (req.user.role === "Resident") {
      requestData.residentId = req.user.userId;
    }

    const request = await MaintenanceRequest.create(requestData);

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

// Retrieve maintenance requests with filtering, text search, and pagination.
app.get("/api/requests", authenticateToken, async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;

    // Validate pagination parameters and apply safe defaults.
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );
    const skip = (page - 1) * limit;

    const filters = {};

    // Residents can only retrieve maintenance requests linked to their own account.
    if (req.user.role === "Resident") {
      filters.residentId = req.user.userId;
    }

    if (status) {
      filters.status = status;
    }

    if (category) {
      filters.category = category;
    }

    if (priority) {
      filters.priority = priority;
    }

    if (search && search.trim()) {
      filters.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Retrieve the requested page and count all matching requests.
    const [requests, totalRequests] = await Promise.all([
      MaintenanceRequest.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MaintenanceRequest.countDocuments(filters),
    ]);

    return res.status(200).json({
      count: requests.length,
      totalRequests,
      currentPage: page,
      totalPages: Math.ceil(totalRequests / limit),
      limit,
      requests,
    });
  } catch (error) {
    console.error("Error retrieving maintenance requests:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve maintenance requests.",
    });
  }
});

// Delete one maintenance request from MongoDB using its ID.
app.delete("/api/requests/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByIdAndDelete(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: "Maintenance request not found.",
      });
    }

    return res.status(200).json({
      message: "Maintenance request deleted successfully!",
      request,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid maintenance request ID.",
      });
    }

    console.error("Error deleting maintenance request:", error.message);

    return res.status(500).json({
      message: "Failed to delete maintenance request.",
    });
  }
});

/* Assign a request only to an employee qualified for its maintenance category. */
app.patch("/api/requests/:id/assign", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { assignedTo } = req.body;

    // Require an employee ID from the maintenance team directory.
    if (typeof assignedTo !== "string" || !assignedTo.trim()) {
      return res.status(400).json({
        message: "A valid maintenance employee ID is required.",
      });
    }

    // Retrieve the request before validating the employee's qualifications.
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Maintenance request not found.",
      });
    }

    // Match the submitted employee ID against the maintenance team directory.
    const employee = maintenanceTeam.find(
      (member) => member.id === assignedTo.trim()
    );

    if (!employee) {
      return res.status(400).json({
        message: "Invalid employee ID. Select an employee from the maintenance team.",
      });
    }

    // Prevent assigning an employee to a category they are not qualified to handle.
    if (!employee.categories.includes(request.category)) {
      return res.status(400).json({
        message: `${employee.name} is not qualified for the ${request.category} category.`,
      });
    }

    // Store the employee's display name and record the assignment in the activity history.
    const previousAssignee = request.assignedTo;
    const newAssignee = employee.name;

    request.assignedTo = newAssignee;

    request.activityHistory.push({
      action: "Request Assigned",
      details: previousAssignee
        ? `Assignment changed from ${previousAssignee} to ${newAssignee}.`
        : `Request assigned to ${newAssignee}.`,
      timestamp: new Date(),
    });

    await request.save();

    return res.status(200).json({
      message: "Maintenance request assigned successfully!",
      request,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid maintenance request ID.",
      });
    }

    console.error("Error assigning maintenance request:", error.message);

    return res.status(500).json({
      message: "Failed to assign maintenance request.",
    });
  }
});

 // Return a safe directory of resident accounts without password hashes.
app.get("/api/residents", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const residents = await User.find({ role: "Resident" })
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      count: residents.length,
      residents: residents.map((resident) => ({
        id: resident._id.toString(),
        name: resident.name,
        email: resident.email,
        role: resident.role,
        createdAt: resident.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error retrieving residents:", error.message);
    return res.status(500).json({
      message: "Failed to retrieve residents.",
    });
  }
});

/**
 * Delete a resident account.
 * Only authenticated Admin users may perform this action.
 */
app.delete(
  "/api/residents/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "Resident account not found.",
        });
      }

      // Never return the deleted user's password hash.
      return res.status(200).json({
        message: "Resident account deleted successfully.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          message: "Invalid resident account ID.",
        });
      }

      console.error("Error deleting resident:", error.message);

      return res.status(500).json({
        message: "Failed to delete resident account.",
      });
    }
  }
);


// Update the status of an existing maintenance request in MongoDB.
app.patch("/api/requests/:id/status", authenticateToken, requireRoles("Admin", "Maintenance"), async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Completed",
      "Assigned",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use Pending, Assigned, In Progress, Completed, or Rejected.",
      });
    }

    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Maintenance request not found.",
      });
    }

// Record the status change in the request's activity history.
    const previousStatus = request.status;
    request.status = status;
    request.activityHistory.push({
      action: "Status Updated",
      details: `Status changed from ${previousStatus} to ${status}.`,
      timestamp: new Date(),
    });
    await request.save();

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

// Retrieve summary counts for the maintenance dashboard.
app.get("/api/requests/summary", authenticateToken, async (req, res) => {
  try {
    // Return global statistics to Admins and personal statistics to Residents.
    const ownerFilter = req.user.role === "Resident"
      ? { residentId: req.user.userId }
      : {};

    const [
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
    ] = await Promise.all([
      MaintenanceRequest.countDocuments(ownerFilter),
      MaintenanceRequest.countDocuments({ ...ownerFilter, status: "Pending" }),
      MaintenanceRequest.countDocuments({ ...ownerFilter, status: "In Progress" }),
      MaintenanceRequest.countDocuments({ ...ownerFilter, status: "Completed" }),
    ]);

    return res.status(200).json({
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
    });
  } catch (error) {
    console.error("Error retrieving request summary:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve maintenance request summary.",
    });
  }
});

/**
 * Retrieve one maintenance request by its MongoDB ID.
 * Returns 404 if the request does not exist and 400 if the ID is invalid.
 */
app.get("/api/requests/:id", authenticateToken,async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request || (req.user.role === "Resident" && String(request.residentId || "") !== String(req.user.userId))) {
      return res.status(404).json({
        message: "Maintenance request not found.",
      });
    }

    return res.status(200).json({
      message: "Maintenance request retrieved successfully.",
      request,
    });
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


/*
 * Update the editable details of an existing maintenance request.
 * Status and assignment are managed by their own dedicated endpoints.
 */
app.patch("/api/requests/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "category",
      "building",
      "roomNumber",
      "priority",
    ];

    const submittedFields = Object.keys(req.body || {});

    // Require at least one field to update.
    if (submittedFields.length === 0) {
      return res.status(400).json({
        message: "Provide at least one field to update.",
      });
    }

    // Prevent changes to status, assignedTo, activityHistory, or other
    // fields through this general edit endpoint.
    const unsupportedFields = submittedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (unsupportedFields.length > 0) {
      return res.status(400).json({
        message: "One or more fields cannot be edited through this endpoint.",
        unsupportedFields,
      });
    }

    // Editable values must be strings.
    for (const field of submittedFields) {
      if (
        typeof req.body[field] !== "string" ||
        !req.body[field].trim()
      ) {
        return res.status(400).json({
          message: `${field} must be a non-empty string.`,
        });
      }
    }

    // Find the existing maintenance request.
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Maintenance request not found.",
      });
    }

    // Track fields whose values actually change.
    const changedFields = submittedFields.filter(
      (field) => request[field] !== req.body[field].trim()
    );

    // Avoid creating unnecessary history entries.
    if (changedFields.length === 0) {
      return res.status(200).json({
        message: "No changes were necessary.",
        request,
      });
    }

    // Apply only the permitted fields.
    for (const field of changedFields) {
      request[field] = req.body[field].trim();
    }

    // Record the edit for the request's activity history.
    request.activityHistory.push({
      action: "Request Edited",
      details: `Updated fields: ${changedFields.join(", ")}.`,
      timestamp: new Date(),
    });

    // Mongoose validates schema requirements and enum values on save.
    await request.save();

    return res.status(200).json({
      message: "Maintenance request updated successfully!",
      request,
    });
  } catch (error) {
    // Handle malformed MongoDB IDs.
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid maintenance request ID.",
      });
    }

    // Handle invalid categories, priorities, and other schema violations.
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid maintenance request data.",
        errors: Object.values(error.errors).map(
          (validationError) => validationError.message
        ),
      });
    }

    console.error("Error updating maintenance request:", error.message);

    return res.status(500).json({
      message: "Failed to update maintenance request.",
    });
  }
});

 // Register a resident account after validating input and hashing the password.
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required registration fields.
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Name, a valid email, and a password of at least 8 characters are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered.
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash the password and create the account with the default Resident role.
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Resident account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Handle duplicate-email conflicts and unexpected registration errors.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Error registering user:", error.message);

    return res.status(500).json({
      message: "Failed to register account.",
    });
  }
});

 // Log in a registered user and issue a JWT after verifying their credentials.
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate the required login fields.
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the account associated with the supplied email.
    const user = await User.findOne({ email: normalizedEmail });

    // Use the same response for unknown emails and incorrect passwords.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Generate a signed token using the secret stored in the environment.
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return the token and safe account details to the client.
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Log unexpected errors and return a generic server response.
    console.error("Error logging in:", error.message);

    return res.status(500).json({
      message: "Failed to log in.",
    });
  }
});

startServer();
