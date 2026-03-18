require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');

const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK (safe no-op when env vars are missing)
initializeFirebase();

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  });
