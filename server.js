const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
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
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://client-seven-ruby.vercel.app',
      'https://client-santhoshsekar999-gmailcoms-projects.vercel.app'
    ];
    const regex = /^http:\/\/.*\.localhost:3000$/; // Allow subdomains of localhost:3000

    if (!origin || allowedOrigins.includes(origin) || regex.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from uploads directory
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