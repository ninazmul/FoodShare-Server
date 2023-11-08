const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); // Import ObjectId from the mongodb library
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.llbekq4.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const foodCollection = client.db("foodShare").collection("availablefood");

    const requestCollection = client.db("foodShare").collection("requestedfood");


    app.get("/requested", async (req, res) => {
      const request = requestCollection.find();
      const result = await request.toArray();
      res.send(result);
    });
    app.post('/requested', async (req, res) => {
      const newRequest = req.body;
      const result = await requestCollection.insertOne(newRequest);
      res.send(result);
    })

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

app.get("/available", async (req, res) => {
  let query = {};
  if (req.query.email) {
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

    app.delete("/available/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
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
