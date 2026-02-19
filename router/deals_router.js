const express = require('express')
const router = express.Router();
const dealsController = require('../controller/deals_controller');
const dealsDraftsController = require('../controller/dealsDrafts_controller')
const stringFile = require('../common/stringify.json');

router.post("/createDeals", (req, res) => {
    dealsController.createDeals(req).then((data) => {
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

router.put("/updateDeal", (req, res) => {
    dealsController.updateDeal(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.delete("/deleteDeal/:_id", (req, res) => {
    dealsController.deleteDeal(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.post("/searchDeals", (req, res) => {
    dealsController.searchDeals(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get('/getDashboardSummary', dealsController.getDashboardSummary);

router.get("/draft/getAllDealsDrafts", (req, res) => {
    dealsDraftsController.getAllDealsDrafts(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});


router.get("/draft/getDraftDealById/:_id", dealsDraftsController.getDraftDealById);

router.put("/draft/updateDraftPayment", dealsDraftsController.updateDraftPayment);

router.get('/getDraftDashboardSummary', dealsDraftsController.getDraftDashboardSummary);

module.exports = router;
