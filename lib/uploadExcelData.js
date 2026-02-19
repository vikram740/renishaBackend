const path = require("path");
const multer = require("multer");
const fs = require("fs");

const uploads = path.join(__dirname, "..", "uploads", "excel");
if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploads),
    filename: (req, file, cb) =>
        cb(null, `excel-${Date.now()}${path.extname(file.originalname)}`)
});

const excelUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes =
            /xlsx|xls/;

        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        const mimetype =
            file.mimetype ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.mimetype === "application/vnd.ms-excel";

        if (extname && mimetype) return cb(null, true);

        cb(new Error("Only Excel files are allowed"));
    }
});

module.exports = excelUpload.single("excelFile");
