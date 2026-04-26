"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const index_1 = require("./index");
// Cloudinary Configuration
cloudinary_1.v2.config({
    cloud_name: index_1.config.cloudinary.cloudName,
    api_key: index_1.config.cloudinary.apiKey,
    api_secret: index_1.config.cloudinary.apiSecret,
});
// Defining the storage engine
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        // Logic to separate folders based on file type
        let folderName = 'app_uploads/others';
        if (file.mimetype.startsWith('image'))
            folderName = 'app_uploads/images';
        if (file.mimetype.startsWith('video'))
            folderName = 'app_uploads/videos';
        if (file.mimetype.startsWith('audio'))
            folderName = 'app_uploads/audios';
        return {
            folder: folderName,
            resource_type: 'auto',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webm', 'mp4', 'mp3'],
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        };
    },
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit for videos/audios
    }
});
exports.default = cloudinary_1.v2;
