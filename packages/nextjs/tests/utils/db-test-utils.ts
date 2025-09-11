import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

export const setupTestDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
};

export const teardownTestDatabase = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

export const clearTestDatabase = async () => {
  const collections = await mongoose.connection.db.collections();
  
  for (const collection of collections) {
    await collection.deleteMany({});
  }
};