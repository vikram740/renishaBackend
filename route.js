const express = require('express');
const router = express.Router();

router.use("/user", require('./router/user_router'));
router.use("/agent", require('./router/agent_router'));
router.use("/member", require('./router/member_router'));
router.use("/nominee", require("./router/nominee_router"));
router.use('/referral', require('./router/referral_router'));
router.use('/collection', require('./router/collection_router'));
router.use('/deals', require('./router/deals_router'));
router.use("/dealsCollection", require("./router/dealsCollection_router"));
router.use("/qrcodes", require("./router/qrCodes_router"));
router.use('/pdfs', require('./router/pdf_router'));
router.use("/manualForm", require('./router/manualForm_router'));

module.exports = router;
