function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ code: "EMAIL_IN_USE", message: "An account with this email already exists." });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ code: "FILE_TOO_LARGE", message: "Image must be 2MB or smaller." });
  }
  if (err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ code: "INVALID_FILE_TYPE", message: "Only PNG, JPEG, or WEBP images are allowed." });
  }
  res.status(500).json({ code: "SERVER_ERROR", message: "Something went wrong. Please try again." });
}

module.exports = errorHandler;
