const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dhtcedohd',
  api_key: 'YCLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@dhtcedohd',
  api_secret: 'bzExK-PpMkQqWO2LtVVFB_8j4EY'
});

// Storage configuration for uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'about-place',
    allowed_formats: ['jpg', 'jpeg', 'png']
  },
});

const upload = multer({ storage });
