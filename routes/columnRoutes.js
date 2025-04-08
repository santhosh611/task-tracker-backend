const express = require('express');
const router = express.Router();
const { 
  getColumns, 
  createColumn, 
  updateColumn, 
  deleteColumn 
} = require('../controllers/columnController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').post(protect, adminOnly, createColumn);
router.route('/:subdomain').get(protect, getColumns)

router.route('/:id')
  .put(protect, adminOnly, updateColumn)
  .delete(protect, adminOnly, deleteColumn);

module.exports = router;