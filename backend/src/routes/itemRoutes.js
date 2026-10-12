const express = require("express");
const {createItem, getItems, getItem, updateItem, deleteItem, updateStatus} = require("../controllers/itemController");
const protect = require("../middleware/auth.middleware");
const uploadImage = require("../middleware/upload");

// 1. Dhyan do ki yahan curly braces { } NAHI lagane hain:
const reportLimiter = require("../middleware/rateLimiter");

const router = express.Router();
router.get("/", getItems);
router.get("/:id", getItem);

// 2. Route mein reportLimiter add kar diya hai:
router.post("/", protect, reportLimiter, uploadImage, createItem);

router.put("/:id", protect, uploadImage, updateItem);
router.patch("/:id/status", protect, updateStatus);
router.delete("/:id", protect, deleteItem);

module.exports = router;