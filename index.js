// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require('./firebaseAdmin'); // Firebase Admin SDK
const verifyToken = require('./middleware/auth'); 

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://homenest-6904d.web.app',
    'https://homenest-6904d.firebaseapp.com',
    'https://home-nest-server-silk.vercel.app'
  ],
  credentials: true,
}));
app.use(express.json());

// MongoDB setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2xgatkm.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

let propertyCollection;
let reviewCollection;

async function initDB() {
  try {
    await client.connect();
    const db = client.db("homeNestDB");
    propertyCollection = db.collection("properties");
    reviewCollection = db.collection("reviews");
    console.log("MongoDB connected!");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

initDB();

// Routes

// Root
app.get('/', (req, res) => res.send('HomeNest server is running!'));

// Add Property (Protected)
app.post('/properties', verifyToken, async (req, res) => {
  const property = req.body;

  if (!property.owner?.name) return res.status(400).json({ message: "Owner name is required" });

  property.owner = {
    uid: req.user.uid,
    name: property.owner.name,
    email: req.user.email
  };
  property.createdAt = new Date();

  if (!property._id) property._id = new Date().getTime().toString(16);

  try {
    const result = await propertyCollection.insertOne(property);
    res.status(201).json({ ...property, insertedId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add property" });
  }
});

// Get All Properties (Public)
app.get('/properties', async (req, res) => {
  try {
    const { search, sort } = req.query;
    const query = {};
    if (search) query.title = { $regex: search, $options: "i" };

    let sortOption = {};
    if (sort === "price-asc") sortOption = { price: 1 };
    else if (sort === "price-desc") sortOption = { price: -1 };
    else if (sort === "date-asc") sortOption = { createdAt: 1 };
    else if (sort === "date-desc") sortOption = { createdAt: -1 };

    const result = await propertyCollection.find(query).sort(sortOption).toArray();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
});

// Get Properties by Logged-in User (Protected)
app.get('/user-properties', verifyToken, async (req, res) => {
  try {
    const result = await propertyCollection.find({ "owner.uid": req.user.uid }).toArray();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user's properties" });
  }
});

// Get Single Property by ID
app.get('/properties/:id', async (req, res) => {
  try {
    const property = await propertyCollection.findOne({ _id: req.params.id });
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch property" });
  }
});

// Update Property (Protected, Owner Only)
app.put('/properties/:id', verifyToken, async (req, res) => {
  try {
    const property = await propertyCollection.findOne({ _id: req.params.id });
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (property.owner.uid !== req.user.uid) return res.status(403).json({ message: "Not allowed" });

    await propertyCollection.updateOne({ _id: req.params.id }, { $set: req.body });
    res.json({ message: "Property updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update property" });
  }
});

// Delete Property (Protected, Owner Only)
app.delete('/properties/:id', verifyToken, async (req, res) => {
  try {
    const property = await propertyCollection.findOne({ _id: req.params.id });
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (property.owner.uid !== req.user.uid) return res.status(403).json({ message: "Not allowed" });

    await propertyCollection.deleteOne({ _id: req.params.id });
    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete property" });
  }
});

// Add Review (Protected)
app.post('/reviews', verifyToken, async (req, res) => {
  const review = req.body;
  if (!review.propertyId) return res.status(400).json({ message: "propertyId is required" });

  review.propertyId = review.propertyId.toString();
  review.reviewerUid = req.user.uid;
  review.reviewerEmail = req.user.email;
  review.createdAt = new Date();

  try {
    const result = await reviewCollection.insertOne(review);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add review" });
  }
});

// Get Reviews by Property ID
app.get('/reviews/:propertyId', async (req, res) => {
  try {
    const reviews = await reviewCollection.find({ propertyId: req.params.propertyId }).toArray();
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// Get Reviews by logged-in user
app.get('/my-ratings', verifyToken, async (req, res) => {
  try {
    const reviews = await reviewCollection.find({ reviewerUid: req.user.uid }).toArray();
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user's ratings" });
  }
});

// Export app for Vercel
module.exports = app;
