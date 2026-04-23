import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Defining the storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Logic to separate folders based on file type
    let folderName = 'app_uploads/others';
    if (file.mimetype.startsWith('image')) folderName = 'app_uploads/images';
    if (file.mimetype.startsWith('video')) folderName = 'app_uploads/videos';
    if (file.mimetype.startsWith('audio')) folderName = 'app_uploads/audios';

    return {
      folder: folderName,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webm', 'mp4', 'mp3'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos/audios
  }
});

export default cloudinary;