const express = require('express')
const router = express.Router();
const dealsCollectionController = require('../controller/dealsCollection_controller');
const stringFile = require('../common/stringify.json');

router.post("/createDealsCollection", (req, res) => {
    dealsCollectionController.createDealsCollection(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get("/getDealsCollectionList", (req, res) => {
    dealsCollectionController.getDealsCollectionList(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get("/getSingleDealCollectionByMemberId/:memberId", (req, res) => {
    dealsCollectionController.getSingleDealCollectionByMemberId(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.delete("/deleteDealCollection/:_id", (req, res) => {
    dealsCollectionController.deleteDealCollection(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

module.exports = router;
