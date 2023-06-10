const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1nqrclq.mongodb.net/?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "Unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB success!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return;
  }

  const db = client.db("summerCamp");
  const classesCollection = db.collection("classes");
  const usersCollection = db.collection("users");
  const cartCollection = db.collection("cart");

  app.get("/users/admin/:email", verifyJWT, async (req, res) => {
    const email = req.params.email;

    if (req.decoded.email !== email) {
      return res.send({ admin: false });
    }

    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const result = { admin: user?.role === "admin" };
    res.send(result);
  });

  app.post("/jwt", (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "3h",
    });
    res.send({ token });
  });

  const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    if (user?.role !== "admin") {
      return res.status(403).send({ error: true, message: "Forbidden access" });
    }
    next();
  };

  app.post("/cart", async (req, res) => {
    const cartItem = req.body;
    console.log("New cart item", cartItem);

    const { email, className } = cartItem;

    const query = { email: email, className: className };
    const existingCartItem = await cartCollection.findOne(query);

    if (existingCartItem) {
      return res.send({ message: "Item already exists in the cart" });
    }

    const result = await cartCollection.insertOne(cartItem);
    res.send(result);
  });

  app.get("/cart", verifyJWT, async (req, res) => {
    const email = req.query.email;
    if (!email) {
      return res.send([]);
    }
    const decodedEmail = req.decoded.email;
    if (email !== decodedEmail) {
      return res.status(403).send({ error: true, message: "Forbidden access" });
    }
    const query = { email: email };
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  });

  app.delete("/cart/:id", async (req, res) => {
    const id = req.params.id;
    console.log("Deleting ", id);
    const query = { _id: new ObjectId(id) };
    const result = await cartCollection.deleteOne(query);
    res.send(result);
  });

  app.post("/users", async (req, res) => {
    const user = req.body;
    console.log("New user", user);
    const query = { email: user.email };
    const existingUser = await usersCollection.findOne(query);
    console.log(existingUser);
    if (existingUser) {
      return res.send({ message: "User already exists" });
    }
    const result = await usersCollection.insertOne(user);
    res.send(result);
  });

  app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
    const cursor = usersCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

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

  app.get("/classes", async (req, res) => {
    const cursor = classesCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

run().catch(console.dir);
