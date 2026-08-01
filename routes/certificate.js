const express = require("express");
const router = express.Router();

const certificateController = require("../controllers/certificateController");
const isAdmin = require("../middleware/authMiddleware");

router.get("/issue", isAdmin, certificateController.issuePage);

router.post("/issue", isAdmin, certificateController.generateCertificate);

router.get("/certificates", isAdmin, certificateController.certificateList);

router.get("/verify", certificateController.verifyPage);
router.post("/verify", certificateController.verifyCertificate);

router.get("/certificate", certificateController.certificatePage);
router.get("/blockchain", isAdmin, certificateController.blockchainRecords);

module.exports = router;