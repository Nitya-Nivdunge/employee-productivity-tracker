const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    console.log('Please check:');
    console.log('1. Is MongoDB running?');
    console.log('2. Is the MONGODB_URI in .env file correct?');
    console.log('3. Check firewall settings');
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log(' Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.log(` Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log(' Mongoose disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;