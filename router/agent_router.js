const express = require('express');
const router = express.Router();
const agentController = require('../controller/agent_controller');
const stringFile = require('../common/stringify.json');
const agentValidator = require('../validator/agent_validator');
const fileUpload = require('../lib/fileUpload');

router.post("/createAgent", (req, res, next) => {
    fileUpload(req, res, function (err) {
        if (err) return res.status(400).send({ message: err.message });
        next();
    });
}, agentValidator.createAgent, (req, res) => {
    agentController.createAgent(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get("/getAgents", (req, res) => {
    agentController.getAgents(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get('/getAgentById/:_id', (req, res) => {
    agentController.getAgentById(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});


router.put("/editAgent", (req, res, next) => {
    fileUpload(req, res, function (err) {
        if (err) return res.status(400).send({ message: err.message });
        next();
    });
}, (req, res) => {
    agentController.editAgent(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.delete('/deleteAgent/:_id', (req, res) => {
    agentController.deleteAgent(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.post("/searchAgent", (req, res) => {
    agentController.searchAgent(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

module.exports = router;
