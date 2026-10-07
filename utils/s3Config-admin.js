const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const multiuploadToS3 = (uploadType) => (req, res, next) => {
    const upload = multer({
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP are allowed."), false);
            }
        },
        storage: multerS3({
            s3: s3,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            cacheControl: 'max-age=31536000',
            key: (_req, file, cb) => {
                cb(null, `${uploadType}/${Date.now()}_${file.originalname}`);
            }
        })
    }).array("images", 10);

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "File size exceeds the 10MB limit." });
            }
            return res.status(400).json({ message: err.message || "Error uploading images" });
        }
        if (err) {
            return res.status(400).json({ message: err.message || "Error uploading images" });
        }
        if (typeof next === 'function') {
            next();
        }
    });
};

const uploadToS3 = (uploadType) => (req, res, next) => {
    const upload = multer({
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
                cb(null, true);
            } else {
                cb(new Error("Invalid file type. Only JPG, JPEG, and PNG are allowed."), false);
            }
        },
        storage: multerS3({
            s3: s3,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            cacheControl: 'max-age=31536000',
            key: (_req, file, cb) => {
                cb(null, `${uploadType}/${Date.now()}_${file.originalname}`);
            }
        })
    }).single("image");

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "File size exceeds the 10MB limit." });
            }
            return res.status(500).json({ message: "Error uploading image", error: err.message });
        }

        if (err) {
            if (err.message.includes("Invalid file type")) {
                return res.status(400).json({ message: "Error uploading image", error: err.message });
            }
            return res.status(500).json({ message: "Error uploading image", error: err.message });
        }
        next();
    });
};

const deleteImageFromS3 = async (imageUrl, uploadType) => {
    if (!imageUrl) return;

    try {
        let key;
        try {
            const pathname = new URL(imageUrl).pathname.replace(/^\/+/, "");
            if (pathname) key = pathname;
        } catch {
            key = null;
        }
        if (!key) {
            const lastSegment = (imageUrl.split("/").pop() || "").split("?")[0];
            const decodedImageKey = decodeURIComponent(lastSegment);
            if (!uploadType) {
                console.log("deleteImageFromS3: uploadType required when imageUrl is not a full URL");
                return;
            }
            key = `${uploadType}/${decodedImageKey}`;
        }

        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key
            })
        );
    } catch (error) {
        console.log("Error deleting image from S3:", error);
    }
};

const uploadVideoToS3 = (uploadType) => (req, res, next) => {
    const upload = multer({
        limits: { fileSize: 100 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowedMimes = [
                'video/mp4', 'video/webm', 'video/quicktime',
                'video/x-matroska', 'video/ogg', 'video/x-m4v'
            ];
            const allowedExts = ['.mp4', '.webm', '.mov', '.mkv', '.ogg', '.m4v'];
            const ext = (file.originalname || '').toLowerCase().slice((file.originalname || '').lastIndexOf('.'));
            if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error("Invalid video format. Only MP4, WebM, MOV, and MKV are allowed."), false);
            }
        },
        storage: multerS3({
            s3: s3,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            cacheControl: 'max-age=31536000',
            key: (_req, file, cb) => {
                cb(null, `${uploadType}/${Date.now()}_${file.originalname}`);
            }
        })
    }).single("video");

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "Video file size exceeds the 100MB limit." });
            }
            return res.status(400).json({ message: err.message || "Error uploading video" });
        }
        if (err) {
            return res.status(400).json({ message: err.message || "Error uploading video" });
        }
        if (typeof next === 'function') {
            next();
        }
    });
};

const multiuploadVideoToS3 = (uploadType) => (req, res, next) => {
    const upload = multer({
        limits: { fileSize: 100 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowedMimes = [
                'video/mp4', 'video/webm', 'video/quicktime',
                'video/x-matroska', 'video/ogg', 'video/x-m4v'
            ];
            const allowedExts = ['.mp4', '.webm', '.mov', '.mkv', '.ogg', '.m4v'];
            const ext = (file.originalname || '').toLowerCase().slice((file.originalname || '').lastIndexOf('.'));
            if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error("Invalid video format. Only MP4, WebM, MOV, and MKV are allowed."), false);
            }
        },
        storage: multerS3({
            s3: s3,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            cacheControl: 'max-age=31536000',
            key: (_req, file, cb) => {
                cb(null, `${uploadType}/${Date.now()}_${file.originalname}`);
            }
        })
    }).array("videos", 10);

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "Video file size exceeds the 100MB limit." });
            }
            return res.status(400).json({ message: err.message || "Error uploading videos" });
        }
        if (err) {
            return res.status(400).json({ message: err.message || "Error uploading videos" });
        }
        if (typeof next === 'function') {
            next();
        }
    });
};

module.exports = { multiuploadToS3, uploadToS3, uploadVideoToS3, multiuploadVideoToS3, deleteImageFromS3 };
