const multer = require("multer");
const path = require("path");
const fs = require("fs");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) cb(null, true);
    else {
      const error = new Error(
        "Unsupported image type. Please upload a JPEG, PNG, WebP, or GIF image."
      );
      error.code = "UNSUPPORTED_IMAGE_TYPE";
      cb(error);
    }
  },
});

const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ message: "Image is too large. Maximum allowed size is 5 MB." });
      }

      if (err.code === "UNSUPPORTED_IMAGE_TYPE") {
        return res.status(415).json({ message: err.message });
      }

      return res.status(400).json({ message: "Unable to upload image." });
    }

    next();
  });
};

module.exports = uploadImage;
module.exports.MAX_IMAGE_SIZE = MAX_IMAGE_SIZE;
module.exports.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;