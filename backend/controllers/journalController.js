const Journal = require("../models/Journal");

const ALLOWED_FIELDS = [
  "title",
  "content",
  "category",
  "date",
  "tags",
  "imageUrl",
  "relatedLinks",
  "notes",
  "reactions",
  "status",
];

const sanitizeJournalBody = (body) => {
  const sanitized = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      sanitized[field] = body[field];
    }
  });
  return sanitized;
};

const getUserIdFromReq = (req) => {
  return req.user ? (req.user._id || req.user.id) : null;
};

exports.createJournal = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: User not logged in or token invalid.",
      });
    }

    const { title, content } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." });
    }

    const userId = getUserIdFromReq(req);
    const sanitized = sanitizeJournalBody(req.body);

    const journalData = {
      ...sanitized,
      status: sanitized.status || "draft",
      user: userId,
    };

    const journal = new Journal(journalData);
    const saved = await journal.save();

    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ message: "Validation failed: " + messages.join(", ") });
    } else if (err.name === "CastError" && err.path === "user") {
      return res
        .status(400)
        .json({ message: "Invalid user ID format for journal creation." });
    }
    res
      .status(500)
      .json({ message: "Error creating journal", error: err.message });
  }
};

exports.getJournals = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: User not logged in or token invalid.",
      });
    }
    const userId = getUserIdFromReq(req);

    const journals = await Journal.find({ user: userId }).sort({
      updatedAt: -1,
    });
    res.json(journals);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching journals", error: err.message });
  }
};

exports.getJournal = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: User not logged in or token invalid.",
      });
    }
    const userId = getUserIdFromReq(req);

    const journal = await Journal.findOne({ _id: req.params.id, user: userId });

    if (!journal) {
      return res
        .status(404)
        .json({ message: "Journal not found or unauthorized" });
    }

    res.json(journal);
  } catch (err) {
    if (err.name === "CastError" && err.path === "_id") {
      return res.status(400).json({ message: "Invalid journal ID format." });
    } else if (err.name === "CastError" && err.path === "user") {
      return res.status(400).json({ message: "Invalid user ID provided." });
    }
    res
      .status(500)
      .json({ message: "Error fetching journal", error: err.message });
  }
};

exports.updateJournal = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: User not logged in or token invalid.",
      });
    }
    const userId = getUserIdFromReq(req);
    const sanitized = sanitizeJournalBody(req.body);

    const updated = await Journal.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      sanitized,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Journal not found or unauthorized" });
    }

    res.json(updated);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ message: "Validation failed: " + messages.join(", ") });
    } else if (
      err.name === "CastError" &&
      (err.path === "_id" || err.path === "user")
    ) {
      return res.status(400).json({ message: "Invalid ID format." });
    }
    res
      .status(500)
      .json({ message: "Error updating journal", error: err.message });
  }
};

exports.deleteJournal = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: User not logged in or token invalid.",
      });
    }
    const userId = getUserIdFromReq(req);

    const deleted = await Journal.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Journal not found or unauthorized" });
    }

    res.status(204).send();
  } catch (err) {
    if (err.name === "CastError" && err.path === "_id") {
      return res.status(400).json({ message: "Invalid journal ID format." });
    } else if (err.name === "CastError" && err.path === "user") {
      return res.status(400).json({ message: "Invalid user ID provided." });
    }
    res
      .status(500)
      .json({ message: "Error deleting journal", error: err.message });
  }
};

exports.uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file uploaded." });
  }

  const imageUrl = req.file.path;

  res.status(200).json({ imageUrl, message: "Image uploaded successfully." });
};