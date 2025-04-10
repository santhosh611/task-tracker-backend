const express = require('express');
const router = express.Router();
const { 
  getDepartments, 
  createDepartment, 
  deleteDepartment,
  updateDepartment,

} = require('../controllers/departmentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getDepartments)
  .post(protect, adminOnly, createDepartment);

router.route('/:id')
  .put(protect, adminOnly, updateDepartment)
  .delete(protect, adminOnly, deleteDepartment);

module.exports = router;