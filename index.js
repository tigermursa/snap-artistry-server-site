const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.use(cors());
app.use(express.json());
// MONGODB CODE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1nqrclq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
//important note : remove try function before vercel deploy
async function run() {
  // MongoDB database and collection ....
  const classesCollection = client.db("summerCamp").collection("classes");
  const usersCollection = client.db("summerCamp").collection("users");
  const cartCollection = client.db("summerCamp").collection("cart");

  // cart api zone starts....>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //1. POST/CREATE FROM HERE...
  app.post("/cart", async (req, res) => {
    const user = req.body;
    console.log("new user", user);
    const result = await cartCollection.insertOne(user);
    res.send(result);
  });
  //2.  GET /READ FROM HERE......
  app.get("/cart", async (req, res) => {
    const email = req.query.email;
    if (!email) {
      res.send([]);
    }
    const query = { email: email };
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  });

  //4. DELETE FROM HERE .....
  app.delete("/cart/:id", async (req, res) => {
    const id = req.params.id;
    console.log("deleting ", id);
    const query = { _id: new ObjectId(id) };
    const result = await cartCollection.deleteOne(query);
    res.send(result);
  });
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> cart api zone starts....>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> users api zone starts....>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //1. POST/CREATE USERS FROM HERE...
  app.post("/users", async (req, res) => {
    const user = req.body;
    console.log("new user", user);
    const query = { email: user.email };
    const existingUser = await usersCollection.findOne(query);
    console.log(existingUser);
    if (existingUser) {
      return res.send({ massage: "user already exists" });
    }
    const result = await usersCollection.insertOne(user);
    res.send(result);
  });

  //2.  GET /READ FROM USERS HERE......
  app.get("/users", async (req, res) => {
    const cursor = usersCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

  // 3 PATCH USERS
  app.patch("/users/admin/:id", async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: "admin",
      },
    };

    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);
  });

  
// 4 DELETE USERS 
  app.delete("/users/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };

    try {
      const result = await usersCollection.deleteOne(filter);

      if (result.deletedCount === 1) {
        res.send({ success: true, message: "User deleted successfully" });
      } else {
        res.status(404).send({ success: false, message: "User not found" });
      }
    } catch (error) {
      res.status(500).send({ success: false, message: "An error occurred" });
    }
  });
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> users api zone Ends....>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //2.  GET /READ FROM HERE......
  app.get("/classes", async (req, res) => {
    const cursor = classesCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

  //3. UPDATE FROM HERE .....................................................,,
  app.get("/task/:id", async (req, res) => {
    const id = req.params.id;
    console.log("updating ", id);
    const query = { _id: new ObjectId(id) };
    const result = await theCollection.findOne(query);
    res.send(result);
  });

  app.put("/task/:id", async (req, res) => {
    const id = req.params.id;
    const user = req.body;
    console.log("updating user", id);
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedUser = {
      $set: {
        title: user.title,
        description: user.description,
        status: user.status,
        date: user.date,
      },
    };
    const result = await theCollection.updateOne(filter, updatedUser, options);
    res.send(result);
  });
  // patch the task status
  app.patch("/task/:id", async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    const filter = { _id: new ObjectId(id) };
    const update = { $set: { status } };
    const result = await theCollection.updateOne(filter, update);
    res.send(result);
  });

  //4. DELETE FROM HERE .....
  app.delete("/task/:id", async (req, res) => {
    const id = req.params.id;
    console.log("deleting ", id);
    const query = { _id: new ObjectId(id) };
    const result = await theCollection.deleteOne(query);
    res.send(result);
  });
  // Send a ping to confirm a successful connection
  await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(" Alhamdulillah summer camp running so hot ");
});
// starting the server>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.listen(port, () => {
  console.log(` summer running so hot ${port} port`);
});
