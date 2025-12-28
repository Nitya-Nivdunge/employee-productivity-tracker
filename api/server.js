// api/server.js - For local development
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fix Mongoose deprecation warning
mongoose.set('strictQuery', false);

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3001', // React dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leave-productivity-analyzer';
    
    console.log('🔄 Attempting MongoDB connection...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n⚠️  Please ensure MongoDB is running:');
    console.log('   Windows: Check Services for MongoDB');
    console.log('   Mac: brew services start mongodb-community');
    console.log('   Linux: sudo systemctl start mongodb');
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Root endpoint - API welcome page
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Leave & Productivity Analyzer API',
    status: 'Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name
    },
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      upload: 'POST /api/upload',
      monthData: 'GET /api/month/:year/:month',
      previousMonth: 'GET /api/previous-month/:year/:month',
      yearData: 'GET /api/year-aggregated/:year',
      workforce: 'GET /api/workforce/:year/:month',
      yearComparison: 'GET /api/year-comparison',
      employeesProductivity: 'GET /api/employees/productivity/:year',
      allMonths: 'GET /api/months',
      allEmployees: 'GET /api/employees'
    },
    instructions: {
      frontend: 'Open http://localhost:3001 to use the application',
      health: 'Visit /api/health to check API status',
      documentation: 'All routes are prefixed with /api'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development',
    mongoConnected: mongoose.connection.readyState === 1,
    database: mongoose.connection.name
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Import and use routes
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'GET /api/test',
      'POST /api/upload',
      'GET /api/month/:year/:month',
      'GET /api/previous-month/:year/:month',
      'GET /api/year-aggregated/:year',
      'GET /api/workforce/:year/:month',
      'GET /api/year-comparison',
      'GET /api/employees/productivity/:year',
      'GET /api/months',
      'GET /api/employees'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Server Information:');
  console.log(`   ✅ Server running on port ${PORT}`);
  console.log(`   🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`   🌐 API test: http://localhost:${PORT}/api/test`);
  console.log(`   📊 API Base: http://localhost:${PORT}/api`);
  console.log(`   🔗 Frontend: http://localhost:3001`);
  console.log('\n📋 Available Commands:');
  console.log('   Press Ctrl+C to stop the server\n');
});

module.exports = app;