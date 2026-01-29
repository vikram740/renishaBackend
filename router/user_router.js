const express = require('express');
const router = express.Router();
const userController = require('../controller/user_controller');
const stringFile = require('../common/stringify.json');
const userValidator = require('../validator/user_validator');

router.post("/login", userValidator.login, (req, res) => {
    userController.login(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.post("/signup", userValidator.signup, (req, res) => {
    userController.signup(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.put("/forgotPassword", userValidator.forgotPassword, (req, res) => {
    userController.forgotPassword(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.put("/resetPassword", userValidator.resetPassword, (req, res) => {
    userController.resetPassword(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get("/usersList", (req, res) => {
    userController.usersList(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.get("/userDetailsById/:_id", (req, res) => {
    userController.userDetailsById(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.put("/updateUser", (req, res) => {
    userController.updateUser(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.delete("/deleteUserById/:_id", (req, res) => {
    userController.deleteUserById(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});

router.post("/searchUser", (req, res) => {
    userController.searchUser(req).then((data) => {
        res.status(stringFile.SUCCESS_STATUS_CODE).send(data)
    }).catch((err) => {
        res.status(stringFile.INTERNAL_ERROR_STATUS_CODE).send(err)
    });
});


module.exports = router;