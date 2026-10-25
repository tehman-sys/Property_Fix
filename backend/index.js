const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;
const mongoose = require("mongoose");

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongo connected");
    app.listen(4000, () => console.log("API running on http://localhost:4000"));
  })
  .catch((err) => console.error("Mongo connection failed:", err.message));

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});