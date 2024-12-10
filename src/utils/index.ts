const multer = require('multer');
const fs = require('fs');

// Define your filename generator function
const generateFilename = (req, file, cb) => {
    const extension = file.originalname.split('.').pop();
    const filename = `${file.fieldname}-${Date.now()}.${extension}`;
    cb(null, filename);
};

// Define your image filter function
const filterImage = (req, file, cb) => {
    // Add your filtering logic here
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

// Set up the multer configuration
export const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const path = 'uploads/';
            fs.mkdirSync(path, { recursive: true });
            cb(null, path);
        },
        filename: generateFilename
    }),
    limits: { fileSize: 10 * 1024 * 1024 },  // max 10MB
    fileFilter: filterImage
}).single('file'); 