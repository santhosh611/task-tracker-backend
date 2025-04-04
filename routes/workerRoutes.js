const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

const { 
  getWorkers, 
  createWorker, 
  getWorkerById, 
  updateWorker, 
  deleteWorker,
  getWorkerActivities,
  resetWorkerActivities,
  getPublicWorkers
} = require('../controllers/workerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWorkers)
  .post(protect, adminOnly, upload.single('photo'), createWorker);

router.get('/public', getPublicWorkers);
  
router.route('/:id')
  .get(protect, getWorkerById)
  .put(protect, adminOnly, upload.single('photo'), updateWorker)
  .delete(protect, adminOnly, deleteWorker);

router.route('/:id/activities')
  .get(protect, getWorkerActivities)
  .delete(protect, adminOnly, resetWorkerActivities);

module.exports = router;