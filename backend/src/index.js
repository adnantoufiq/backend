require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');

const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK (safe no-op when env vars are missing)
initializeFirebase();

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(port) + 1;
      console.warn(`⚠️ Port ${port} is in use. Retrying on port ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
};

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    startServer(PORT);
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  });
