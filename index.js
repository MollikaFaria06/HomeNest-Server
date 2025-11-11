const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

//middlware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2xgatkm.mongodb.net/?appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    await client.connect();

    const propertyCollection = client.db("homeNestDB").collection("properties");
    const reviewCollection = client.db("homeNestDB").collection("reviews");

    // Add Property (POST)
    app.post('/properties', async (req, res) => {
      const property = req.body;
      const result = await propertyCollection.insertOne(property);
      res.send(result);
    });

    // Get All Properties (GET)
    app.get('/properties', async (req, res) => {
      const result = await propertyCollection.find().toArray();
      res.send(result);
    });

    // Get Single Property (GET by id)
    app.get('/properties/:id', async (req, res) => {
  const id = req.params.id;

  const result = await propertyCollection.findOne({ _id: id });
  if (!result) return res.status(404).json({ message: 'Property not found' });
  res.send(result);
});


    // Delete Property
    app.delete('/properties/:id', async (req, res) => {
      const id = req.params.id;
      const result = await propertyCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update Property
    app.patch('/properties/:id', async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      const result = await propertyCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updated }
      );
      res.send(result);
    });

    // Add Review
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // Get All Reviews
    app.get('/reviews', async (req, res) => {
    const result = await reviewCollection.find().toArray();
    res.send(result);
    });

    // Get Reviews by Property
    app.get('/reviews/:propertyId', async (req, res) => {
    const propertyId = req.params.propertyId; // string
    const result = await reviewCollection.find({ propertyId: propertyId }).toArray();
    res.send(result);
    });


    // Get My Ratings
    app.get('/my-ratings', async (req, res) => {
      const email = req.query.email;
      const result = await reviewCollection.find({ reviewerEmail: email }).toArray();
      res.send(result);
    });

    console.log("HomeNest API routes ready!");

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB! You are connected.");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('HomeNest server is running!')
})

app.listen(port, () => {
  console.log(`HomeNest server is running on port ${port}`)
})
