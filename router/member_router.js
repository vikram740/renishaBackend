const express = require('express')
const router = express.Router();
const fileUpload = require("../lib/fileUpload");
const memberController = require('../controller/member_controller');
const stringFile = require('../common/stringify.json');
const memberValidator = require('../validator/member_validator');

router.post("/createMember", (req, res, next) => {
    fileUpload(req, res, function (err) {
        if (err) return res.status(400).send({ message: err.message });
        next();
    });
}, memberValidator.createMember, (req, res) => {
    memberController.createMember(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get("/getMembers", (req, res) => {
    memberController.getMembers(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get("/getMemberById/:_id", (req, res) => {
    memberController.getMemberById(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.put("/editMember/:memberId", (req, res, next) => {
    fileUpload(req, res, function (err) {
        if (err) return res.status(400).send({ message: err.message });
        next();
    });
}, (req, res) => {
    memberController.editMember(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.delete("/deleteMember/:_id", (req, res) => {
    memberController.deleteMember(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.post("/searchMember", (req, res) => {
    memberController.searchMember(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});


module.exports = router;