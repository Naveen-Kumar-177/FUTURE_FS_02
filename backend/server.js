
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    source: { type: String, default: "Website" },
    status: {
      type: String,
      enum: ["new", "contacted", "converted"],
      default: "new"
    },
    notes: [
      {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    followUp: { type: String, default: "" }
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);

// Check whether the backend is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CRM API is running" });
});

// Get all leads
app.get("/api/leads", async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status &&
        ["new", "contacted", "converted"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

// Create a lead
app.post("/api/leads", async (req, res, next) => {
  try {
    const { name, email, phone, company, source, status, followUp } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: "Name and email are required"
      });
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      source,
      status,
      followUp
    });

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

// Edit a lead or change its status
app.put("/api/leads/:id", async (req, res, next) => {
  try {
    const allowed = [
      "name", "email", "phone", "company",
      "source", "status", "followUp"
    ];

    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
});

// Add a note to a lead
app.post("/api/leads/:id/notes", async (req, res, next) => {
  try {
    const text = req.body.text?.trim();

    if (!text) {
      return res.status(400).json({
        message: "Note text is required"
      });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text } } },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
});

// Delete a lead
app.delete("/api/leads/:id", async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error(error.message);

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }

  res.status(500).json({ message: "Internal server error" });
});

// Connect to MongoDB, then start the API
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
