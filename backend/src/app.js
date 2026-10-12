const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()
const connectDB = require('./db/db')
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const claimRoutes = require("./routes/claimRoutes");

const app = express();
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api", claimRoutes);

app.get("/", (req, res) => {
    res.json({ message: "API running" })
})

const PORT = process.env.PORT

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
})