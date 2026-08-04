require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { Resend } = require("resend");

// ======================================================
// RESEND
// ======================================================

const resend = new Resend(process.env.RESEND_API_KEY);

// ======================================================
// DATABASE PATH
// ======================================================

const dbPath = path.join(__dirname, "../database/db.json");

// ======================================================
// READ DATABASE
// ======================================================

function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, "utf8");

    if (!data.trim()) {
      return { certificates: [] };
    }

    const database = JSON.parse(data);

    if (!Array.isArray(database.certificates)) {
      database.certificates = [];
    }

    return database;

  } catch (error) {
    console.error("Database Read Error:", error);

    return {
      certificates: []
    };
  }
}

// ======================================================
// WRITE DATABASE
// ======================================================

function writeDatabase(data) {
  fs.writeFileSync(
    dbPath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// ======================================================
// CREATE HASH DATA
// ======================================================

function createHashData(data) {
  return (
    data.certificateId +
    data.studentName +
    data.rollNumber +
    data.email +
    data.course +
    data.department +
    data.certificateTitle +
    data.grade +
    data.issueDate
  );
}

// ======================================================
// VERIFY CERTIFICATE INTEGRITY
// ======================================================

function verifyCertificateIntegrity(certificate) {

  if (!certificate || !certificate.blockchainHash) {
    return false;
  }

  const hashData = createHashData(certificate);

  const recalculatedHash = crypto
    .createHash("sha256")
    .update(hashData)
    .digest("hex");

  return recalculatedHash === certificate.blockchainHash;
}

// ======================================================
// VERIFY BLOCKCHAIN CHAIN
// ======================================================

function verifyBlockchainChain(certificates) {

  if (!Array.isArray(certificates)) {
    return false;
  }

  for (let i = 0; i < certificates.length; i++) {

    const currentCertificate = certificates[i];

    if (!currentCertificate.previousHash) {
      continue;
    }

    if (currentCertificate.previousHash === "GENESIS") {
      continue;
    }

    if (i === 0) {
      return false;
    }

    const previousCertificate = certificates[i - 1];

    if (
      currentCertificate.previousHash !==
      previousCertificate.blockchainHash
    ) {
      return false;
    }
  }

  return true;
}

// ======================================================
// SEND CERTIFICATE EMAIL
// ======================================================

async function sendCertificateEmail(certificate, baseUrl) {

  try {

    const verifyUrl =
      `${baseUrl}/verify?certificateId=${encodeURIComponent(
        certificate.certificateId
      )}`;

    const viewUrl =
      `${baseUrl}/certificate?id=${encodeURIComponent(
        certificate.certificateId
      )}`;

    const response = await resend.emails.send({

      // Resend testing sender
      from: "TrustLedger <onboarding@resend.dev>",

      to: certificate.email,

      subject:
        `Your Certificate Has Been Issued - ${certificate.certificateTitle}`,

      html: `
        <!DOCTYPE html>
        <html>
        <body style="
          margin:0;
          padding:0;
          background:#f4f6fb;
          font-family:Arial,sans-serif;
          color:#333;
        ">

          <div style="
            max-width:650px;
            margin:30px auto;
            background:white;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 8px 30px rgba(0,0,0,0.08);
          ">

            <div style="
              background:linear-gradient(135deg,#4f46e5,#7c3aed);
              padding:35px 25px;
              text-align:center;
              color:white;
            ">

              <h1 style="margin:0;">
                TrustLedger
              </h1>

              <p style="
                margin:8px 0 0;
                opacity:.9;
              ">
                Blockchain Secured Certificate
              </p>

            </div>

            <div style="padding:35px;">

              <h2 style="
                margin-top:0;
                color:#222;
              ">
                Congratulations, ${certificate.studentName}! 🎉
              </h2>

              <p style="
                font-size:16px;
                line-height:1.7;
              ">
                Your certificate has been successfully issued
                and secured by TrustLedger.
              </p>

              <div style="
                background:#f7f7fb;
                padding:22px;
                border-radius:12px;
                margin:25px 0;
              ">

                <p>
                  <strong>Certificate ID:</strong><br>
                  ${certificate.certificateId}
                </p>

                <p>
                  <strong>Certificate:</strong><br>
                  ${certificate.certificateTitle}
                </p>

                <p>
                  <strong>Course:</strong><br>
                  ${certificate.course}
                </p>

                <p>
                  <strong>Department:</strong><br>
                  ${certificate.department}
                </p>

                <p>
                  <strong>Result / Grade:</strong><br>
                  ${certificate.grade}
                </p>

                <p style="margin-bottom:0;">
                  <strong>Issue Date:</strong><br>
                  ${certificate.issueDate}
                </p>

              </div>

              <p style="
                font-size:15px;
                line-height:1.6;
              ">
                You can view your certificate or verify its
                authenticity using the buttons below.
              </p>

              <div style="
                text-align:center;
                margin-top:30px;
              ">

                <a
                  href="${viewUrl}"
                  style="
                    display:inline-block;
                    background:#4f46e5;
                    color:white;
                    text-decoration:none;
                    padding:13px 24px;
                    border-radius:8px;
                    margin:6px;
                    font-weight:bold;
                  "
                >
                  View Certificate
                </a>

                <a
                  href="${verifyUrl}"
                  style="
                    display:inline-block;
                    background:#198754;
                    color:white;
                    text-decoration:none;
                    padding:13px 24px;
                    border-radius:8px;
                    margin:6px;
                    font-weight:bold;
                  "
                >
                  Verify Certificate
                </a>

              </div>

              <hr style="
                border:none;
                border-top:1px solid #eee;
                margin:35px 0 20px;
              ">

              <p style="
                text-align:center;
                font-size:13px;
                color:#777;
              ">
                This certificate is digitally secured and
                verified by TrustLedger.
              </p>

            </div>

          </div>

        </body>
        </html>
      `
    });

    // Resend can return an error object without throwing
    if (response.error) {
      console.error(
        "❌ Certificate Email Error:",
        response.error
      );
      return false;
    }

    console.log(
      `📧 Certificate Email Sent To: ${certificate.email}`
    );

    console.log(
      "Email ID:",
      response.data?.id
    );

    return true;

  } catch (error) {

    // Email failure will NOT stop certificate generation
    console.error(
      "❌ Certificate Email Error:",
      error
    );

    return false;
  }
}

// ======================================================
// ISSUE CERTIFICATE PAGE
// ======================================================

exports.issuePage = (req, res) => {

  res.render("issueCertificate");

};

// ======================================================
// GENERATE CERTIFICATE
// ======================================================

exports.generateCertificate = async (req, res) => {

  try {

    console.log("🔥 NEW CONTROLLER IS RUNNING 🔥");

    const {
      studentName,
      rollNumber,
      email,
      course,
      department,
      certificateTitle,
      grade,
      issueDate,
      template
    } = req.body;

    // ==================================================
    // BASIC VALIDATION
    // ==================================================

    if (
      !studentName ||
      !rollNumber ||
      !email ||
      !course ||
      !department ||
      !certificateTitle ||
      !grade ||
      !issueDate
    ) {

      return res
        .status(400)
        .send("Please fill all certificate details.");
    }

    // ==================================================
    // TEMPLATE VALIDATION
    // ==================================================

    const allowedTemplates = [
      "classic",
      "purple",
      "gold",
      "blue",
      "green"
    ];

    const selectedTemplate =
      allowedTemplates.includes(template)
        ? template
        : "classic";

    // ==================================================
    // GENERATE CERTIFICATE ID
    // ==================================================

    const certificateId =
      "TL" +
      new Date().getFullYear() +
      Date.now().toString().slice(-6);

    // ==================================================
    // INTERNAL CERTIFICATE DATA
    // ==================================================

    const certificateData = {

      certificateId,

      studentName: studentName.trim(),

      rollNumber: rollNumber.trim(),

      email: email.trim(),

      course: course.trim(),

      department: department.trim(),

      certificateTitle:
        certificateTitle.trim(),

      grade,

      issueDate
    };

    // ==================================================
    // GENERATE SHA-256 HASH
    // ==================================================

    const hashData =
      createHashData(certificateData);

    const blockchainHash = crypto
      .createHash("sha256")
      .update(hashData)
      .digest("hex");

    // ==================================================
    // BASE URL
    // ==================================================

    const baseUrl =
      `${req.protocol}://${req.get("host")}`;

    // ==================================================
    // VERIFICATION URL
    // ==================================================

    const verificationUrl =
      `${baseUrl}/verify?certificateId=${encodeURIComponent(
        certificateId
      )}`;

    // ==================================================
    // QR CODE FOLDER
    // ==================================================

    const qrFolder = path.join(
      __dirname,
      "../public/qrcodes"
    );

    if (!fs.existsSync(qrFolder)) {

      fs.mkdirSync(
        qrFolder,
        {
          recursive: true
        }
      );
    }

    // ==================================================
    // QR CODE FILE
    // ==================================================

    const qrFileName =
      `${certificateId}.png`;

    const qrFilePath =
      path.join(
        qrFolder,
        qrFileName
      );

    // ==================================================
    // GENERATE QR CODE
    // ==================================================

    await QRCode.toFile(
      qrFilePath,
      verificationUrl,
      {
        width: 300,
        margin: 2
      }
    );

    // ==================================================
    // READ DATABASE
    // ==================================================

    const database =
      readDatabase();

    // ==================================================
    // PREVIOUS BLOCK HASH
    // ==================================================

    let previousHash =
      "GENESIS";

    if (
      database.certificates.length > 0
    ) {

      const previousCertificate =
        database.certificates[
          database.certificates.length - 1
        ];

      if (
        previousCertificate.blockchainHash
      ) {

        previousHash =
          previousCertificate.blockchainHash;

      }
    }

    // ==================================================
    // FINAL CERTIFICATE OBJECT
    // ==================================================

    const certificate = {

      certificateId,

      studentName:
        certificateData.studentName,

      rollNumber:
        certificateData.rollNumber,

      email:
        certificateData.email,

      course:
        certificateData.course,

      department:
        certificateData.department,

      certificateTitle:
        certificateData.certificateTitle,

      grade,

      issueDate,

      template:
        selectedTemplate,

      blockchainHash,

      previousHash,

      qrCode:
        `/qrcodes/${qrFileName}`,

      status:
        "Valid",

      createdAt:
        new Date().toISOString()
    };

    // ==================================================
    // SAVE CERTIFICATE
    // ==================================================

    database.certificates.push(
      certificate
    );

    writeDatabase(database);

    console.log(
      `✅ Certificate Generated: ${certificateId}`
    );

    console.log(
      `🎨 Template: ${selectedTemplate}`
    );

    // ==================================================
    // AUTOMATIC EMAIL
    // ==================================================

    await sendCertificateEmail(
      certificate,
      baseUrl
    );

    // ==================================================
    // REDIRECT
    // ==================================================

    return res.redirect(
      "/certificates"
    );

  } catch (error) {

    console.error(
      "Certificate Generation Error:",
      error
    );

    return res
      .status(500)
      .send(
        "Error generating certificate."
      );
  }
};

// ======================================================
// CERTIFICATE LIST
// ======================================================

exports.certificateList = (req, res) => {

  try {

    const database =
      readDatabase();

    return res.render(
      "certificateList",
      {
        certificates:
          database.certificates
      }
    );

  } catch (error) {

    console.error(
      "Certificate List Error:",
      error
    );

    return res.render(
      "certificateList",
      {
        certificates: []
      }
    );
  }
};

// ======================================================
// VERIFY PAGE
// ======================================================

exports.verifyPage = (req, res) => {

  try {

    const certificateId =
      req.query.certificateId;

    if (certificateId) {

      const database =
        readDatabase();

      const certificate =
        database.certificates.find(
          cert =>
            cert.certificateId ===
            certificateId
        );

      let integrityValid =
        false;

      if (certificate) {

        integrityValid =
          verifyCertificateIntegrity(
            certificate
          );
      }

      return res.render(
        "verify",
        {
          certificate:
            certificate || null,

          searched:
            true,

          integrityValid
        }
      );
    }

    return res.render(
      "verify",
      {
        certificate:
          null,

        searched:
          false,

        integrityValid:
          false
      }
    );

  } catch (error) {

    console.error(
      "Verify Page Error:",
      error
    );

    return res
      .status(500)
      .send(
        "Error loading verification page."
      );
  }
};

// ======================================================
// VERIFY CERTIFICATE MANUALLY
// ======================================================

exports.verifyCertificate = (req, res) => {

  try {

    const certificateId =
      (req.body.certificateId || "")
        .trim();

    if (!certificateId) {

      return res.render(
        "verify",
        {
          certificate:
            null,

          searched:
            true,

          integrityValid:
            false
        }
      );
    }

    const database =
      readDatabase();

    const certificate =
      database.certificates.find(
        cert =>
          cert.certificateId &&
          cert.certificateId
            .toLowerCase() ===
          certificateId
            .toLowerCase()
      );

    let integrityValid =
      false;

    if (certificate) {

      integrityValid =
        verifyCertificateIntegrity(
          certificate
        );
    }

    return res.render(
      "verify",
      {
        certificate:
          certificate || null,

        searched:
          true,

        integrityValid
      }
    );

  } catch (error) {

    console.error(
      "Verification Error:",
      error
    );

    return res
      .status(500)
      .send(
        "Error verifying certificate."
      );
  }
};

// ======================================================
// VIEW CERTIFICATE
// ======================================================

exports.certificatePage = (req, res) => {

  try {

    const certificateId =
      req.query.id;

    const database =
      readDatabase();

    const certificate =
      database.certificates.find(
        cert =>
          cert.certificateId ===
          certificateId
      );

    if (!certificate) {

      return res
        .status(404)
        .send(
          "Certificate not found."
        );
    }

    return res.render(
      "certificate",
      {
        certificate
      }
    );

  } catch (error) {

    console.error(
      "Certificate View Error:",
      error
    );

    return res
      .status(500)
      .send(
        "Error loading certificate."
      );
  }
};

// ======================================================
// BLOCKCHAIN RECORDS
// ======================================================

exports.blockchainRecords = (req, res) => {

  try {

    const database =
      readDatabase();

    const certificates =
      database.certificates;

    const chainValid =
      verifyBlockchainChain(
        certificates
      );

    return res.render(
      "blockchain",
      {
        certificates,
        chainValid
      }
    );

  } catch (error) {

    console.error(
      "Blockchain Records Error:",
      error
    );

    return res.render(
      "blockchain",
      {
        certificates: [],
        chainValid: false
      }
    );
  }
};