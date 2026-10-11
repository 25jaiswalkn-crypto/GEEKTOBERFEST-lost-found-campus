const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const User = require("../models/User");

const createClaim = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Claim message is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.status !== "active") {
      return res.status(400).json({ message: `Cannot submit claim for an item that is already ${item.status}` });
    }

    if (item.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot claim your own item" });
    }

    const existingClaim = await Claim.findOne({
      item: item._id,
      claimant: req.user._id,
      status: "pending",
    });

    if (existingClaim) {
      return res.status(400).json({ message: "You already have a pending claim" });
    }

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user._id,
      message: message.trim(),
    });

    res.status(201).json({ message: "Claim submitted successfully", claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClaims = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not allowed to view these claims" });
    }

    const claims = await Claim.find({ item: item._id })
      .populate({ path: "claimant", select: "name email", model: User })
      .populate({ path: "item", select: "title status", model: Item })
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid claim status" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid claim ID format" });
    }

    const claim = await Claim.findById(id).populate({ path: "item", model: Item });
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (!claim.item) {
      return res.status(404).json({ message: "Associated item not found" });
    }

    if (claim.item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot manage this claim" });
    }

    if (claim.status !== "pending") {
      return res.status(400).json({ message: `Claim has already been ${claim.status}` });
    }

    if (status === "approved") {
      if (claim.item.status === "recovered") {
        return res.status(400).json({ message: "Cannot approve claim: item is already recovered" });
      }

      if (claim.item.status === "claimed") {
        return res.status(400).json({ message: "Cannot approve claim: item is already claimed" });
      }

      if (claim.item.status !== "active") {
        return res.status(400).json({ message: `Cannot approve claim: item is ${claim.item.status}` });
      }

      // Concurrency check: atomically update the item status from 'active' to 'claimed'
      const updatedItem = await Item.findOneAndUpdate(
        { _id: claim.item._id, status: "active" },
        { status: "claimed" },
        { returnDocument: "after" }
      );

      if (!updatedItem) {
        return res.status(409).json({ message: "Item is no longer available to be claimed" });
      }

      try {
        claim.status = "approved";
        await claim.save();
      } catch (saveError) {
        // Rollback item status to keep consistency if saving claim fails
        await Item.findByIdAndUpdate(claim.item._id, { status: "active" });
        throw saveError;
      }

      claim.item.status = "claimed";
      return res.json({ message: "Claim approved", claim });
    }

    if (status === "rejected") {
      claim.status = "rejected";
      await claim.save();
      return res.json({ message: "Claim rejected", claim });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClaims, updateClaim, createClaim };