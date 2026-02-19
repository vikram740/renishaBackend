const express = require("express");
const router = express.Router();
const { generatePDFController } = require("../controller/pdf_controller");


router.get("/investmentPdf/:dealId/:memberId/:nomineeId", generatePDFController);


module.exports = router;
