const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://foodshare-b19e2.web.app",
      "https://foodshare-b19e2.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.llbekq4.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middleware2
const logger = (req, res, next) => {
  console.log('log: info', req.method, req.url);
  next();
}

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  // console.log('token in the middleware', token);
  if (!token) {
  return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded;
    next();
  })
  // next();
}

async function run() {
  try {
    await client.connect();
    const foodCollection = client.db("foodShare").collection("availablefood");
    const requestCollection = client
      .db("foodShare")
      .collection("requestedfood");

    app.post("/jwt",logger,verifyToken, async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
        .send({ success: true });
    });

    app.post('/signOut', async (req, res) => {
      const user = req.body;
      res.clearCookie('token', { maxAge: 0 })
        .send({ success: true });
    })


    app.get("/requested",verifyToken, logger, async (req, res) => {
      const request = requestCollection.find();
      const result = await request.toArray();
      res.send(result);
    });
    app.post("/requested", async (req, res) => {
      const newRequest = req.body;
      const result = await requestCollection.insertOne(newRequest);
      res.send(result);
    });

    app.delete("/requested/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const result = await requestCollection.deleteOne({ _id: objectId });
      if (result.deletedCount === 1) {
        res.send({ message: "Request canceled successfully" });
      } else {
        res.status(404).send({ error: "Request not found" });
      }
    });

    app.get("/available", async (req, res) => {
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/available", logger, verifyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/available/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const foodItem = await foodCollection.findOne({ _id: objectId });
      res.send(foodItem);
    });

    app.post("/available", async (req, res) => {
      const addNew = req.body;
      const result = await foodCollection.insertOne(addNew);
      res.send(result);
    });

    app.put("/available/:id", logger,verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateFood = req.body;
      const food = {
        $set: {
          foodName: updateFood.foodName,
          pickupLocation: updateFood.pickupLocation,
          expiredDate: updateFood.expiredDate,
          foodImage: updateFood.foodImage,
          displayName: updateFood.displayName,
          requestDate: updateFood.requestDate,
          email: updateFood.email,
          donationAmount: updateFood.donationAmount,
          additionalNotes: updateFood.additionalNotes,
          foodQuantity: updateFood.foodQuantity,
          photoURL: updateFood.photoURL,
          available: updateFood.available,
        },
      };
      const result = await foodCollection.updateOne(filter, food, options);
      res.send(result);
    });

    app.delete("/available/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("food share unity is running");
});

app.listen(port, () => {
  console.log(`food share unity server is running on port ${port}`);
});
