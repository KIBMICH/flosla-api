import mongoose from 'mongoose';
import app from './app';
import { config } from './config';

const start = async () => {
  try {
    // MongoDB connection - modern Mongoose auto-handles pooling & timeouts
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });

    // Set timeout for requests
    server.timeout = 30000; // 30 seconds

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
