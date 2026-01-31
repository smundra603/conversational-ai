import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  throw new Error('MONGO_URI is not defined in environment variables');
}

mongoose.connection.on('connected', () => {
  logger.info({ message: 'Mongoose default connection open' });
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  logger.error({ message: `Mongoose default connection error: ${err}` });
});

mongoose.set('strictQuery', false);

export const connectMongoDB = async () => {
  try {
    console.log('Connecting to MongoDB');
    const options: mongoose.ConnectOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

    await mongoose.connect(mongoURI, options);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export const closeMongoDBConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info({ message: 'Mongoose default connection closed' });
  } catch (error) {
    logger.error({ message: `Error closing MongoDB connection: ${error}` });
  }
};
