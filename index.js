const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sjbgh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const run = async () => {
  try {
    await client.connect();
    const database = client.db("hospital");
    const userCollection = database.collection("users");
    const doctorsCollection = database.collection("doctors");
    const appointmentCollection = database.collection("appointments");
    const reviewCollection = database.collection("reviews");

    app.post("/users", async (req, res) => {
      const data = req.body;
      let result;
      if (data.email) {
        result = await userCollection.insertOne(data);
      }
      res.json(result);
    });

    // update or insert an user
    app.put("/users", async (req, res) => {
      const doc = req.body;
      const filter = { email: doc.email, displayName: doc.displayName };
      const options = { upsert: true };
      const updateDoc = { $set: filter };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // update user role in admin
    app.put("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await userCollection.updateOne(filter, updateDoc);

      res.json(result);
    });

    // get admin
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      let isAdmin = false;
      const user = await userCollection.findOne(query);
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // insert an appointment
    app.post("/appointments", async (req, res) => {
      const data = req.body;
      let result = await appointmentCollection.insertOne(data);
      res.json(result);
    });

    // insert doctor
    app.post("/doctors", async (req, res) => {
      const data = req.body;
      let result = await doctorsCollection.insertOne(data);
      res.json(result);
    });

    // get all doctors
    app.get("/doctors", async (req, res) => {
      let data = await doctorsCollection.find({}).toArray();
      res.json(data);
    });

    // get a doctor
    app.get("/doctors/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await doctorsCollection.findOne(query);
      res.json(product);
    });

    // get your appointments
    app.get("/appointments/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      let result;
      if (query.email) {
        result = await appointmentCollection.find(query).toArray();
      }
      res.json(result);
    });

    // get all appointments
    app.get("/appointments", async (req, res) => {
      const result = await appointmentCollection.find({}).toArray();
      res.json(result);
    });

    // insert user review
    app.post("/reviews", async (req, res) => {
      const doc = req.body;
      const result = await reviewCollection.insertOne(doc);
      res.json(result);
    });

    // get review
    app.get("/reviews", async (req, res) => {
      const query = await reviewCollection.find({}).toArray();
      res.send(query);
    });

    // get all students
    app.get("/reviewlist", async (req, res) => {
      const cursor = reviewCollection.find({});
      const page = req.query.currentPage;
      const size = parseInt(req.query.perPageItem);

      let products;
      const count = await cursor.count();
      if (page) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }

      res.send({
        count,
        products,
      });
    });

    // Delete a student details
    app.delete("/reviewlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.json(result);
    });

    app.get("/payment/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };
      const product = await appointmentCollection.findOne(query);
      res.json(product);
    });

    // delete specific order
    app.delete("/allappointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await appointmentCollection.deleteOne(query);
      res.json(result);
    });

    // update specific order
    app.put("/allappointments/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Appointed",
        },
      };
      const result = await appointmentCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
  } finally {
    // client.close();
  }
};
run().catch(console.dir());

app.get("/", (req, res) => {
  res.send("Hello world! Welcome to server!");
});

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
