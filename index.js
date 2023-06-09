const express = require("express");
const app = express();
const DB = require("./database.js");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { peerProxy } = require("./peerProxy.js");

const authCookieName = "token";

const PORT = process.argv.length > 2 ? process.argv[2] : 4000;

app.use(express.json());

app.use(cookieParser());

app.use(express.static("public"));

app.set("trust proxy", true);

//Code to use apiRouter
var apiRouter = express.Router();
app.use(`/api`, apiRouter);

//Endpoint to get workouts from database
apiRouter.get("/workouts", async (_req, res) => {
  const workouts = await DB.getWorkouts();
  res.send(workouts);
});

//Endpoint to create a new user
apiRouter.post("/auth/create", async (req, res) => {
  if (await DB.getUser(req.body.userName)) {
    res.status(409).send({ msg: "Existing User" });
  } else {
    const user = await DB.createUser(
      req.body.userName,
      req.body.password,
      req.body.age,
      req.body.height,
      req.body.weight,
      req.body.hardestSend,
      req.body.progress
    );

    setAuthCookie(res, user.token);
    res.send({
      id: user._id,
    });
    return;
  }
});

//Endpoint to authenticate an existing user
apiRouter.post("/auth/login", async (req, res) => {
  const user = await DB.getUser(req.body.userName);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      setAuthCookie(res, user.token);
      res.send({ id: user._id });
      return;
    }
  }
  res.status(401).send({ msg: "Unauthorized" });
});

//Deletes token if stored in cookie
apiRouter.delete("/auth/logout", (_req, res) => {
  res.clearCookie(authCookieName);
  res.status(204).end();
});

//Endpoints to add and get workout entries for specific users
apiRouter.post("/entry", async (req, res) => {
  const entry = await DB.addEntry(req.body);
  return res.send({ msg: "Added to database" });
});

apiRouter.put("/update/:userName", async (req, res) => {
  if (await DB.updateUser(req.params.userName)) {
    res.send({ msg: "Able to update" });
  } else {
    res.send({ msg: "Not able to update user" });
  }
});

//Endpoint to get info from DB about a user (used at login)
apiRouter.get("/user/:userName", async (req, res) => {
  const user = await DB.getUser(req.params.userName);
  if (user) {
    const token = req?.cookies.token;
    res.send({ user: user, authenticated: token === user.token });
    return;
  }
  res.status(404).send({ msg: "Unknown" });
});

var secureApiRouter = express.Router();
apiRouter.use(secureApiRouter);

secureApiRouter.use(async (req, res, next) => {
  authToken = req.cookies[authCookieName];
  const user = await DB.getUserByToken;
  if (user) {
    next();
  } else {
    res.status(401).send({ msg: "Unauthorized" });
  }
});

//Endpoint to get all entries made by a user
secureApiRouter.get("/entries/:userName", async (req, res) => {
  const entries = await DB.getEntries(req.params.userName);
  res.send(entries);
});

app.use((_req, res) => {
  res.sendFile("index.html", { root: "public" });
});

function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
  });
}

const httpService = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

peerProxy(httpService);

//I only ran this code once, to populate the database with workouts (commented out below)
//workouts.forEach(workout => DB.addWorkout(workout));

// const workouts = [
//   {
//     day: "odd",
//     category: "Climbing Specific",
//     exercises: [
//       { type: "checkbox", text: "Warm-Up on wall", for: "warmup" },
//       { type: "checkbox", text: "Max Hang Warm Up", for: "hang-warmup" },
//       {
//         type: "checkbox",
//         text: "Max Hangs *",
//         for: "hangs",
//         tooltext: "4 sets: 8 seconds on, 52 seconds off with weight",
//         rangetext: "How many did you complete? ",
//         inputtext: "How much weight did you use?",
//       },
//       {
//         type: "checkbox",
//         text: "Campus Board *",
//         for: "campus",
//         tooltext: "6 sets: 4 laddering, 2 skipping",
//         rangetext: "How many did you complete? ",
//       },
//       { type: "checkbox", text: "Project Bouldering" },
//       {
//         type: "input",
//         text: "What is the difficulty of your hardest project? (V-scale)",
//       },
//       { type: "checkbox", text: "Limit Bouldering" },
//       {
//         type: "checkbox",
//         text: "Front Lever *",
//         tooltext: "4 x 10 seconds",
//         rangetext: "How many did you complete? ",
//       },
//       { type: "checkbox", text: "Cool Down" },
//     ],
//   },
//   {
//     day: "even",
//     category: "Strength Training",
//     exercises: [
//       { type: "checkbox", text: "Warm Up" },
//       {
//         type: "checkbox",
//         text: "Bench Press *",
//         tooltext: "3 x 8",
//         inputtext: "How much weight did you use? ",
//       },
//       {
//         type: "checkbox",
//         text: "Tricep Extensions *",
//         tooltext: "3 x 10 on cable machine",
//         inputtext: "How much weight did you use?",
//       },
//       {
//         type: "checkbox",
//         text: "Shoulder Press *",
//         tooltext: "3 x 8",
//         inputtext: "How much weight did you use?",
//       },
//       {
//         type: "checkbox",
//         text: "Lat Pull-downs *",
//         tooltext: "3 x 10",
//         inputtext: "How much weight did you use?",
//       },
//       {
//         type: "checkbox",
//         text: "Barbell Squats *",
//         tooltext: "3 x 10",
//         inputtext: "How much weight did you use?",
//       },
//     ],
//   },
//   { day: "rest", category: "Rest Day", exercises: [] },
// ];
