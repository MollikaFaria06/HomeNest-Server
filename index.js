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

      // Validate owner info
      if (!property.owner || !property.owner.name || !property.owner.email) {
        return res.status(400).json({ message: "Owner info (name & email) is required" });
      }

      property.createdAt = new Date();

      // Ensure unique string ID
      if (!property._id) property._id = new Date().getTime().toString(16);

      try {
        const result = await propertyCollection.insertOne(property);
        res.status(201).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to add property" });
      }
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

    // Get Properties by Logged-in User
    app.get('/user-properties', async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).json({ message: "Email is required" });

      try {
        const result = await propertyCollection.find({ "owner.email": email }).toArray();
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch user's properties" });
      }
    });

    // Get Single Property by ID
app.get("/properties/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let query;

    // ✅ Safely handle both ObjectId and string-based _id
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id };
    }

    const property = await propertyCollection.findOne(query);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ message: "Failed to fetch property" });
  }
});



    // Delete Property (only by owner)
    app.delete("/properties/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await propertyCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete property" });
  }
});
   // Update Property (only by owner)
   app.put("/properties/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    let filter;

    // ✅ Handle both string IDs and ObjectIds safely
    if (ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { _id: id }; // your custom string _id
    }

    const result = await propertyCollection.updateOne(filter, { $set: updatedData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json({ message: "Property updated successfully", result });
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ message: "Failed to update property" });
  }
});



    // Add Review
    app.post('/reviews', async (req, res) => {
      const review = req.body;
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
      const propertyId = req.params.propertyId;
      try {
        const result = await reviewCollection.find({ propertyId }).toArray();
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch reviews" });
      }
    });

    // Get Reviews submitted by logged-in user
    app.get('/my-ratings', async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).json({ message: 'Email is required' });

      try {
        const reviews = await reviewCollection.find({ reviewerEmail: email }).toArray();
        res.json(reviews);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch user's ratings" });
      }
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
