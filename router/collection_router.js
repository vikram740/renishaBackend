const express = require('express');
const router = express.Router();
const collectionController = require('../controller/collection_controller');
const stringFile = require('../common/stringify.json');

router.post("/createCollection", (req, res) => {
    collectionController.createCollection(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get('/getcollections', (req, res) => {
    collectionController.getcollections(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get('/getcollectionById/:_id', (req, res) => {
    collectionController.getcollectionById(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get('/getCollectionByMember/:_id', (req, res) => {
    collectionController.getCollectionByMember(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get('/getCollectionDashboard', (req, res) => {
    collectionController.getCollectionDashboard(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

module.exports = router;
