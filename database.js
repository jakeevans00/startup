const { MongoClient } = require("mongodb");
const config = require("./dbConfig.json");

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db("startup");
const userCollection = db.collection("user");
const workoutCollection = db.collection("workout");

// This will asynchronously test the connection and exit the process if it fails
(async function testConnection() {
  await client.connect();
  await db.command({ ping: 1 });
})().catch((ex) => {
  console.log(
    `Unable to connect to database with ${url} because ${ex.message}`
  );
  process.exit(1);
});

async function addWorkouts(workouts) {
  const result = await workoutCollection.insertMany(workouts);
  return result;
}

function getWorkouts() {
  const cursor = workoutCollection.find();
  return cursor.toArray();
}

module.exports = {
  addWorkouts,
  getWorkouts,
};
