const express = require('express')
const router = express.Router();
const qrController = require('../controller/qrCodes_controller');
const stringFile = require('../common/stringify.json');
const fileUpload = require('../lib/fileUpload');

router.post("/createQrCodes", (req, res, next) => {
    fileUpload(req, res, function (err) {
        if (err) return res.status(400).send({ message: err.message });
        next();
    });
}, (req, res) => {
    qrController.createQrCodes(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get("/getAllQrCodes", (req, res) => {
    qrController.getAllQrCodes(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});


router.get('/getSingleQrCodeById/:_id', (req, res) => {
    qrController.getSingleQrCodeById(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.put("/UpdateQrCodePrimary/:_id", (req, res, next) => {
    fileUpload(req, res, function (err) {
        if (err) return res.status(400).send({ message: err.message });
        next();
    });
}, (req, res) => {
    qrController.UpdateQrCodePrimary(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.delete("/deleteQRcode/:_id", (req, res) => {
    qrController.deleteQRcode(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.post("/searchQRcode", (req, res) => {
    qrController.searchQRcode(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

module.exports = router;
