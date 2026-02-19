const path = require("path");
const multer = require("multer");
const fs = require("fs");

const uploads = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads);
    console.log("'uploads' folder created.");
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploads);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);

    }
});

const maxSize = 5 * 1024 * 1024;

var fileUpload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {
        var filetypes = /jpeg|jpg|png|pdf/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname)
            return cb(null, true);
        return cb(new Error("Only JPG, JPEG & PNG files allowed!"));
    }
}).fields([

    { name: "memberPhoto", maxCount: 1 },
    { name: "memberSignature", maxCount: 1 },
    { name: "uploadMemberAdhaar", maxCount: 1 },
    { name: "uploadMemberPan", maxCount: 1 },

    { name: "agentPhoto", maxCount: 1 },
    { name: "agentSignature", maxCount: 1 },

    { name: "nomineePhoto", maxCount: 1 },
    { name: "nomineeSignature", maxCount: 1 },

    { name: "qrCodeFile", maxCount: 1 },

]);

module.exports = fileUpload;