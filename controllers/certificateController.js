const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode");

// ================= DATABASE PATH =================

const dbPath = path.join(__dirname, "../database/db.json");

// ================= READ DATABASE =================

function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, "utf8");

    if (!data.trim()) {
      return { certificates: [] };
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Database Read Error:", error);
    return { certificates: [] };
  }
}

// ================= WRITE DATABASE =================

function writeDatabase(data) {
  fs.writeFileSync(
    dbPath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// ================= VERIFY CERTIFICATE INTEGRITY =================

function verifyCertificateIntegrity(certificate) {

  const hashData =
    certificate.certificateId +
    certificate.studentName +
    certificate.rollNumber +
    certificate.email +
    certificate.course +
    certificate.department +
    certificate.certificateTitle +
    certificate.grade +
    certificate.issueDate;

  const recalculatedHash = crypto
    .createHash("sha256")
    .update(hashData)
    .digest("hex");

  return recalculatedHash === certificate.blockchainHash;
}

// ================= VERIFY BLOCKCHAIN CHAIN =================

function verifyBlockchainChain(certificates) {

  for (let i = 0; i < certificates.length; i++) {

    const currentCertificate = certificates[i];

    // Skip old records that were created before previousHash was added
    if (!currentCertificate.previousHash) {
      continue;
    }

    // First linked certificate / Genesis block
    if (currentCertificate.previousHash === "GENESIS") {
      continue;
    }

    // Check previous certificate
    if (i === 0) {
      return false;
    }

    const previousCertificate = certificates[i - 1];

    // Previous hash must match previous certificate's blockchain hash
    if (
      currentCertificate.previousHash !==
      previousCertificate.blockchainHash
    ) {
      return false;
    }
  }

  return true;
}

// ================= ISSUE PAGE =================

exports.issuePage = (req, res) => {
  res.render("issueCertificate");
};

// ================= GENERATE CERTIFICATE =================

exports.generateCertificate = async (req, res) => {
  try {
    const {
      studentName,
      rollNumber,
      email,
      course,
      department,
      certificateTitle,
      grade,
      issueDate
    } = req.body;

    // Generate unique Certificate ID

    const certificateId =
      "TL" +
      new Date().getFullYear() +
      Date.now().toString().slice(-6);

    // Generate SHA-256 blockchain-style hash

    const hashData =
      certificateId +
      studentName +
      rollNumber +
      email +
      course +
      department +
      certificateTitle +
      grade +
      issueDate;

    const blockchainHash = crypto
      .createHash("sha256")
      .update(hashData)
      .digest("hex");

    // Verification URL stored inside QR

    const verificationUrl =
      `${req.protocol}://${req.get("host")}/verify?certificateId=${encodeURIComponent(certificateId)}`;

    // QR file path

    const qrFolder = path.join(
      __dirname,
      "../public/qrcodes"
    );

    // Make sure QR folder exists

    if (!fs.existsSync(qrFolder)) {
      fs.mkdirSync(qrFolder, { recursive: true });
    }

    const qrFileName = `${certificateId}.png`;

    const qrFilePath = path.join(
      qrFolder,
      qrFileName
    );

    // Generate REAL QR Code

    await QRCode.toFile(
      qrFilePath,
      verificationUrl,
      {
        width: 300,
        margin: 2
      }
    );
// Read existing database

    const database = readDatabase();

    if (!Array.isArray(database.certificates)) {
      database.certificates = [];
    }
    // Get previous certificate hash

let previousHash = "GENESIS";

if (database.certificates.length > 0) {

  previousHash =
    database.certificates[
      database.certificates.length - 1
    ].blockchainHash;

}
    // Certificate Object

    const certificate = {
      certificateId,
      studentName,
      rollNumber,
      email,
      course,
      department,
      certificateTitle,
      grade,
      issueDate,

      blockchainHash,
      previousHash,
      qrCode: `/qrcodes/${qrFileName}`,

      status: "Valid",

      createdAt: new Date().toISOString()
    };

    // Add new certificate

    database.certificates.push(certificate);

    // Save database

    writeDatabase(database);

    console.log(
      "✅ Certificate Generated:",
      certificateId
    );

    // Go to Certificate List

    res.redirect("/certificates");

  } catch (error) {
    console.error(
      "❌ Certificate Generation Error:",
      error
    );

    res.status(500).send(
      "Error generating certificate."
    );
  }
};

// ================= CERTIFICATE LIST =================

exports.certificateList = (req, res) => {
  try {
    const database = readDatabase();

    res.render("certificateList", {
      certificates: database.certificates || []
    });

  } catch (error) {
    console.error(error);

    res.render("certificateList", {
      certificates: []
    });
  }
};

// ================= VERIFY PAGE =================

exports.verifyPage = (req, res) => {

  const certificateId = req.query.certificateId;

  // QR code se verification
  if (certificateId) {

    const database = readDatabase();

    const certificate = database.certificates.find(
      cert => cert.certificateId === certificateId
    );

    let integrityValid = false;

if (certificate) {
  integrityValid = verifyCertificateIntegrity(certificate);
}

return res.render("verify", {
  certificate: certificate || null,
  searched: true,
  integrityValid: integrityValid
});
  }

  // Normal Verify Certificate page
  res.render("verify", {
    certificate: null,
    searched: false,
    integrityValid: false
  });

};
exports.verifyCertificate = (req, res) => {

  try {

    const certificateId = req.body.certificateId.trim();

    const database = readDatabase();

    const certificate = database.certificates.find(
      cert =>
        cert.certificateId.toLowerCase() ===
        certificateId.toLowerCase()
    );

    let integrityValid = false;

if (certificate) {
  integrityValid = verifyCertificateIntegrity(certificate);
}

res.render("verify", {
  certificate: certificate || null,
  searched: true,
  integrityValid: integrityValid
});

  } catch (error) {

    console.error("Verification Error:", error);

    res.status(500).send("Error verifying certificate.");

  }

};

// ================= CERTIFICATE PAGE =================
exports.certificatePage = (req, res) => {
  try {

    const certificateId = req.query.id;

    const database = readDatabase();

    const certificate = database.certificates.find(
      cert => cert.certificateId === certificateId
    );

    if (!certificate) {
      return res.status(404).send("Certificate not found");
    }

    res.render("certificate", {
      certificate: certificate
    });

  } catch (error) {

    console.error("Certificate View Error:", error);

    res.status(500).send("Error loading certificate");

  }
};

exports.blockchainRecords = (req, res) => {
  try {

    const database = readDatabase();

const certificates = database.certificates || [];

const chainValid = verifyBlockchainChain(certificates);

res.render("blockchain", {
  certificates: certificates,
  chainValid: chainValid
});

  } catch (error) {

    console.error("Blockchain Records Error:", error);

    res.render("blockchain", {
      certificates: []
    });

  }
};