const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});