const multer = require("multer");
const path = require("path");

const AVATAR_DIR = path.join(__dirname, "..", "..", "uploads", "avatars");

const MIME_EXTENSIONS = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    let ext = MIME_EXTENSIONS[file.mimetype];
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (MIME_EXTENSIONS[file.mimetype]) {
    cb(null, true);
  } else {
    let err = new Error("Unsupported file type");
    err.code = "INVALID_FILE_TYPE";
    cb(err);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = { upload, AVATAR_DIR };
