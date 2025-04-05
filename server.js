const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');
const topicRoutes = require('./routes/topicRoutes');
const commentRoutes = require('./routes/commentRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const columnRoutes = require('./routes/columnRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const foodRequestRoutes = require('./routes/foodRequestRoutes');

// Load env vars
dotenv.config();
connectDB();
const app = express();

// Configure CORS to allow requests from your client with credentials
app.use(cors({
  origin: ['http://localhost:3000', 'https://client-seven-ruby.vercel.app','http://localhost:5173','https://client-santhoshsekar999-gmailcoms-projects.vercel.app/'],

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization','Cache-Control']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Determine uploads directory based on environment
const uploadsDir = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'uploads')  // A relative path for production
  : path.join(__dirname, 'uploads');     // Development path

// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/food-requests', foodRequestRoutes);

// Route for checking API status
app.get('/', (req, res) => {
  res.json({ message: 'Task Tracker API is running' });
});

// Error handler

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/test-cloudinary', async (req, res) => {
  const cloudinary = require('./config/cloudinary');
  
  console.log('ENV Variables Check:');
  console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Is set' : 'Not set');
  console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Is set' : 'Not set');
  
  try {
    // Rest of the code...
  } catch (error) {
    console.error('Cloudinary test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary test failed',
      error: error.message
    });
  }
});