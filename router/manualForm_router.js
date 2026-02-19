const express = require("express");
const router = express.Router();
const fileUpload = require("../lib/fileUpload");
const manualFormController = require("../controller/manualforms_controller");

const stringFile = require("../common/stringify.json");

router.post(
    "/createManualForm",
    fileUpload,
    async (req, res) => {
        try {
            const data = await manualFormController.createManualForm(req);
            res.status(stringFile.SUCCESS_STATUS_CODE).send(data);
        } catch (err) {
            console.error(err);
            res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send({
                message: err.message || "Manual form creation failed"
            });
        }
    }
);

router.post(
    "/addDealTransaction", async (req, res) => {
        try {
            const data = await manualFormController.addDealTransaction(req);
            res.status(stringFile.SUCCESS_STATUS_CODE).send(data);
        } catch (err) {
            console.error(err);
            res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send({
                message: err.message || "Payment & interest failed"
            });
        }
    }
);

module.exports = router;
