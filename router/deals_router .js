const express = require('express')
const router = express.Router();
const dealsController = require('../controller/deals_controller');
const stringFile = require('../common/stringify.json');

router.post("/createDeals", (req, res) => {
    dealsController.createDeals(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});


router.get('/getMemberDealsById/:_id', (req, res) => {
    dealsController.getMemberDealsById(req)
        .then(data => res.status(stringFile.SUCCESS_STATUS_CODE).send(data))
        .catch(err => res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err));
});

router.delete("/deleteDeal/:_id", (req, res) => {
    dealsController.deleteDeal(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.post("/payInstallment", (req, res) => {
    dealsController.payInstallment(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});



router.get('/getAllDeals', (req, res) => {
    dealsController.getAllDeals(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get('/getDealById/:_id', (req, res) => {
    dealsController.getDealById(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});


module.exports = router;
