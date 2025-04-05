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
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWorkers)
  .post(protect, adminOnly, upload.single('photo'), createWorker); // Remove adminOnly for now

router.post('/public', getPublicWorkers);
  
router.route('/:id')
  .get(protect, getWorkerById)
  .put(protect, adminOnly, upload.single('photo'), updateWorker)
  .delete(protect, adminOnly, deleteWorker);

router.route('/:id/activities')
  .get(protect, getWorkerActivities)
  .delete(protect, adminOnly, resetWorkerActivities);

module.exports = router;