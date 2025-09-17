const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const UserRouter = require("./App/router/UserRoute");
require("dotenv").config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to enable CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Connect to MongoDB using the URL from environment variables
mongoose
  .connect(process.env.URL)
  .then(() => {
    console.log("DB Connection Created Successfully");
    // Start the server after DB connection is established
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    // Handle DB connection errors
    console.error("DB Connection Failed:", err.message);
  });

// Mount user routes under /api prefix
app.use("/api/", UserRouter);
