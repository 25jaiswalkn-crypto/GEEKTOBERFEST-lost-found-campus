const mongoose = require("mongoose");
const Item = require("../models/Item");
const User = require("../models/User");

const owner = { path: "reportedBy", select: "name email", model: User };

const buildImageUrl = (req) =>
  `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

const createItem = async (req, res) => {
  try {
    const { title, description, type, category, location, date } = req.body;

    if (!title || !description || !type || !category || !location || !date) {
      return res.status(400).json({ message: "All fields required" });
    }

    const item = await Item.create({
      title,
      description,
      type,
      category,
      location,
      date,
      image: req.file ? buildImageUrl(req) : "",
      reportedBy: req.user._id,
    });

    res.status(201).json({ message: "Item reported successfully", item });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getItems = async (req, res) => {
  try {
    const { search, category, location, type, status } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (location) filter.location = location;
    if (type) filter.type = type;
    if (status) filter.status = status;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const items = await Item.find(filter)
      .populate(owner)
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    const item = await Item.findById(req.params.id).populate(owner);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own reports" });
    }

    const allowed = ["title", "description", "type", "category", "location", "date"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) {
      updates.image = buildImageUrl(req);
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after",
      runValidators: true,
    });

    res.json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own reports" });
    }

    await item.deleteOne();
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "claimed", "recovered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own reports" });
    }

    // Idempotent update
    if (item.status === status) {
      return res.json({ message: "Status updated", item });
    }

    // Direct transition to claimed is forbidden; items only become claimed via claim approval
    if (status === "claimed") {
      return res.status(400).json({ message: "Items can only be marked as claimed through claim approval" });
    }

    // A recovered item cannot become claimed
    if (item.status === "recovered" && status === "claimed") {
      return res.status(400).json({ message: "A recovered item cannot be changed to claimed" });
    }

    // A claimed item cannot become recovered or active
    if (item.status === "claimed") {
      return res.status(400).json({ message: `A claimed item cannot be changed to ${status}` });
    }

    // Allowed transition: 'active' -> 'recovered' (owner marks item recovered)
    // Allowed transition: 'recovered' -> 'active' (owner reopens item)
    if (item.status === "active" && status === "recovered") {
      item.status = "recovered";
    } else if (item.status === "recovered" && status === "active") {
      item.status = "active";
    } else {
      return res.status(400).json({ message: `Invalid status transition from ${item.status} to ${status}` });
    }

    await item.save();

    res.json({ message: "Status updated", item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, updateStatus };