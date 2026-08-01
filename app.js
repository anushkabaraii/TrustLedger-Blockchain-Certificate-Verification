const express = require("express");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const app = express();

// Routes
const authRoutes = require("./routes/auth");
const certificateRoutes = require("./routes/certificate");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "certchain_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/", authRoutes);
app.use("/", certificateRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {

    console.log(`🚀 Server running at http://localhost:${PORT}`);

  });
