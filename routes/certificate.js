const express = require("express");
const router = express.Router();

const certificateController = require(
  "../controllers/certificateController"
);

const isAdmin = require(
  "../middleware/authMiddleware"
);

// ======================================================
// ISSUE CERTIFICATE
// ======================================================

// Show Issue Certificate page
router.get(
  "/issue",
  isAdmin,
  certificateController.issuePage
);

// Generate and save certificate
router.post(
  "/issue",
  isAdmin,
  certificateController.generateCertificate
);

// ======================================================
// CERTIFICATE LIST
// ======================================================

router.get(
  "/certificates",
  isAdmin,
  certificateController.certificateList
);

// ======================================================
// VERIFY CERTIFICATE
// ======================================================

// Public verification page
router.get(
  "/verify",
  certificateController.verifyPage
);

// Manual certificate verification
router.post(
  "/verify",
  certificateController.verifyCertificate
);

// ======================================================
// VIEW CERTIFICATE
// ======================================================

router.get(
  "/certificate",
  certificateController.certificatePage
);

// ======================================================
// BLOCKCHAIN RECORDS
// ======================================================

router.get(
  "/blockchain",
  isAdmin,
  certificateController.blockchainRecords
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;