const express = require("express");
var cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_KEY);
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vbl1j76.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("contestHub");
    const userCollection = database.collection("users");
    const contestCollection = database.collection("contests");
    const paymentCollection = database.collection("payments");

    //User Collection
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const email = user.email;
      const query = {email: email};
      const find = await userCollection.findOne(query);
      console.log("Find", find);
      if (!find) {
        const result = await userCollection.insertOne(user);
        res.send(result);
      }
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const {role} = req.body;
      const updatedDoc = {
        $set: {
          role: role,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.put("/usersActivity/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const {activity} = req.body;
      const updatedDoc = {
        $set: {
          activity: activity,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //Contest
    app.get("/contests", async (req, res) => {
      const cursor = contestCollection.find().sort({participants: -1});
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/contests", async (req, res) => {
      const contest = req.body;
      const result = await contestCollection.insertOne(contest);
      res.send(result);
    });

    app.delete("/contests/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await contestCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/contests/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          confirmation: true,
        },
      };
      const result = await contestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.put("/contestsParticipants/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          contestParticipants: req.body.participants + 1,
        },
      };
      const result = await contestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.put("/contestsComment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const {comment} = req.body;
      const updatedDoc = {
        $set: {
          comment: comment,
        },
      };
      const result = await contestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.put("/contestsRegistered/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $addToSet: {
          contestRegistered: req.body.contestRegistered,
        },
      };
      const result = await contestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.get("/", async (req, res) => {
      res.send("Hello World!");
    });

    app.post("/create-payment-intent", async (req, res) => {
      const {price} = req.body;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send(result);
    });

    await client.db("admin").command({ping: 1});
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:5000/`);
});
