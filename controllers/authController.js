const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/db.json");

exports.homePage = (req, res) => {
  res.render("index");
};

exports.loginPage = (req, res) => {

  res.render("login", {
    error: null
  });

};

exports.login = (req, res) => {

  const { username, password } = req.body;

  // Admin credentials
  if (
  username === process.env.ADMIN_USERNAME &&
  password === process.env.ADMIN_PASSWORD
) {

    req.session.isAdmin = true;

    return res.redirect("/dashboard");
  }

  res.render("login", {
    error: "Invalid username or password"
  });

};

exports.dashboard = (req, res) => {

  try {

    const data = fs.readFileSync(dbPath, "utf8");

    const database = data.trim()
      ? JSON.parse(data)
      : { certificates: [] };

    const certificates = database.certificates || [];

    // Total Certificates
    const totalCertificates = certificates.length;

    // Blockchain Records
    const blockchainRecords = certificates.filter(
      cert => cert.blockchainHash
    ).length;

    // Certificates issued today
    const today = new Date().toISOString().split("T")[0];

    const issuedToday = certificates.filter(
      cert => cert.issueDate === today
    ).length;

    // Latest 5 certificates
    const recentCertificates =
      certificates.slice().reverse().slice(0, 5);

    res.render("dashboard", {

      totalCertificates,
      issuedToday,
      blockchainRecords,
      recentCertificates

    });

  } catch (error) {

    console.error("Dashboard Error:", error);

    res.render("dashboard", {

      totalCertificates: 0,
      issuedToday: 0,
      blockchainRecords: 0,
      recentCertificates: []

    });

  }

};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};