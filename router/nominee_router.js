const express = require("express");
const router = express.Router();
const nomineeController = require("../controller/nominee-controller");
const stringFile = require("../common/stringify.json");
const nomineeValidators = require("../validator/nominee_validator");
const fileUpload = require("../lib/fileUpload");

router.get('/getNominees', (req, res) => {
    nomineeController.getNominees(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get('/getNomineeById/:_id', (req, res) => {
    nomineeController.getNomineeById(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.put("/editNominee", (req, res, next) => {
    fileUpload(req, res, function (err) {
        if (err) return res.status(400).send({ message: err.message });
        next();
    });
}, (req, res) => {
    nomineeController.editNominee(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.delete('/deleteNominee/:_id', (req, res) => {
    nomineeController.deleteNominee(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.post("/searchNominee", (req, res) => {
    nomineeController.searchNominee(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

module.exports = router;