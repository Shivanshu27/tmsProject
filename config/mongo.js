const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'sessions';

const mongoConnectionURL = "mongodb://localhost:27017/sessions";

async function connectMongo() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');
//   app.set('db', client.db(dbName))
  global.mongodb = client.db(dbName);
//   const collection = db.collection('documents');

  return 'done.';
} 

module.exports = {connectMongo, mongoConnectionURL}