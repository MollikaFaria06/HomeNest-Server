const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2xgatkm.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
  try {
    await client.connect();
    const propertyCollection = client.db("homeNestDB").collection("properties");
    const reviewCollection = client.db("homeNestDB").collection("reviews");

    // Add Property
    app.post('/properties', async (req, res) => {
  const property = req.body;
  property.createdAt = new Date();
  if (!property._id) property._id = new Date().getTime().toString(16); // unique string ID
  const result = await propertyCollection.insertOne(property);
  res.send(result);
});


    // Get All Properties with Search & Sort
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
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch properties" });
      }
    });

    // Get Single Property by ID (string or ObjectId)
    app.get('/properties/:id', async (req, res) => {
  const { id } = req.params;
  const property = await propertyCollection.findOne({ _id: id }); // strictly string match
  if (!property) return res.status(404).json({ message: 'Property not found' });
  res.send(property);
});


    // Add Review
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // Get Reviews by Property
    app.get('/reviews/:propertyId', async (req, res) => {
      const propertyId = req.params.propertyId;
      const result = await reviewCollection.find({ propertyId }).toArray();
      res.send(result);
    });

      // Get Reviews submitted by logged-in user
    app.get('/my-ratings', async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: 'Email is required' });

      const reviews = await reviewCollection.find({ reviewerEmail: email }).toArray();
      res.send(reviews);
    });

    console.log("HomeNest API ready!");
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connected!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('HomeNest server is running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));
