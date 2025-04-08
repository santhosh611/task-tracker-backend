const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const upload = multer({ dest: 'uploads/' });
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
const { protect, adminOnly, adminOrWorker } = require('../middleware/authMiddleware');

router.route('/').post(protect, adminOnly, upload.single('photo'), createWorker); // Remove adminOnly for now
router.route('/all').post(protect, adminOrWorker, getWorkers);

router.post('/public', getPublicWorkers);
  
router.route('/:id')
  .get(protect, getWorkerById)
  .put(protect, adminOnly, upload.single('photo'), updateWorker)
  .delete(protect, adminOnly, deleteWorker);

router.route('/:id/activities')
  .get(protect, getWorkerActivities)
  .delete(protect, adminOnly, resetWorkerActivities);

module.exports = router;