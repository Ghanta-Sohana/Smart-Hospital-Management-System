import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        callback(null, `${Date.now()}-${safeName}`)
    }
});

const upload = multer({ storage: storage })

const allowedMedicalMimeTypes = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/bmp",
    "text/plain",
    "text/csv",
    "application/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/rtf",
    "text/rtf",
    "application/x-rtf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream"
]);

const allowedMedicalExtensions = new Set([
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".bmp",
    ".txt",
    ".csv",
    ".doc",
    ".docx",
    ".rtf",
    ".xls",
    ".xlsx"
]);

const medicalFileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (allowedMedicalMimeTypes.has(file.mimetype) && allowedMedicalExtensions.has(extension)) {
        return callback(null, true);
    }
    callback(new Error("Unsupported medical history file type"));
};

const medicalHistoryUpload = multer({
    storage,
    fileFilter: medicalFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10
    }
});

export default upload
export { medicalHistoryUpload }
