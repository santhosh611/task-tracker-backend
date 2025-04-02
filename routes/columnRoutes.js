const express = require('express');
const router = express.Router();
const { 
  getColumns, 
  createColumn, 
  updateColumn, 
  deleteColumn,
  cleanupComments
} = require('../controllers/columnController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getColumns)
  .post(protect, adminOnly, createColumn);
 
router.route('/:id')
  .put(protect, adminOnly, updateColumn)
  .delete(protect, adminOnly, deleteColumn);
  


module.exports = router;