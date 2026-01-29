const { check, validationResult } = require("express-validator");
const stringFile = require("../common/stringify.json")
const md5 = require("md5");
const userModel = require("../model/user_model");


exports.signup = [
    check("email").not().isEmpty().withMessage(stringFile.EMAIL_NOT_EMPLY).isEmail().withMessage(stringFile.VALID_EMAIL_ID).trim(),
    check("password").not().isEmpty().withMessage(stringFile.PASSWORD_NOT_EMPTY),
    check("email").custom(async (value) => {
        const user = await userModel
            .findOne(
                {
                    email: value.toLowerCase(),
                },
                {
                    _id: 1
                }
            )
            .lean()
            .catch((e) => {
                throw Error(e.message);
            });
        if (user) throw Error(stringFile.EXISTS_EMAIL);
        else return true;
    }),
    (req, res, next) => {
        const errorValidation = validationResult(req);
        if (!errorValidation.isEmpty()) {
            return res.status(stringFile.VALIDATION_ERROR_STATUS_CODE).send({
                message: errorValidation.errors.shift().msg,
            });
        }
        next();
    },
];

exports.login = [
    check("email")
        .not()
        .isEmpty()
        .withMessage(stringFile.EMAIL_NOT_EMPTY)
        .isEmail()
        .withMessage(stringFile.VALID_EMAIL_ID)
        .trim(),
    check("password").not().isEmpty().withMessage(stringFile.PASSWORD_NOT_EMPTY),
    check("email").custom(async (value) => {
        const user = await userModel
            .findOne(
                {
                    email: value.toLowerCase(),
                },
                {
                    _id: 1,
                }
            )
            .lean()
            .catch((e) => {
                throw Error(e.message);
            });
        if (!user) throw Error(stringFile.WRONG_EMAIL);
        else return true;
    }),
    check("password").custom(async (value, { req }) => {
        const user = await userModel
            .findOne(
                {
                    email: req.body.email.toLowerCase(),
                    password: md5(value),
                },
                {
                    _id: 1,
                }
            )
            .lean()
            .catch((e) => {
                throw Error(e.message);
            });
        if (!user) throw Error(stringFile.WRONG_PASSWORD);
        else return true;
    }),
    (req, res, next) => {
        const errorValidation = validationResult(req);
        if (!errorValidation.isEmpty()) {
            return res.status(stringFile.VALIDATION_ERROR_STATUS_CODE).send({
                message: errorValidation.errors.shift().msg,
            });
        }
        next();
    },
];

exports.forgotPassword = [
    check("email")
        .not()
        .isEmpty()
        .withMessage(stringFile.EMAIL_NOT_EMPTY)
        .isEmail()
        .withMessage(stringFile.VALID_EMAIL_ID)
        .trim(),
    check("email").custom(async (value) => {
        const user = await userModel
            .findOne(
                {
                    email: value.toLowerCase(),
                },
                {
                    _id: 1,
                }
            )
            .lean()
            .catch((e) => {
                throw Error(e.message);
            });
        if (!user) throw Error(stringFile.WRONG_EMAIL);
        else return true;
    }),
    (req, res, next) => {
        const errorValidation = validationResult(req);
        if (!errorValidation.isEmpty()) {
            return res.status(stringFile.VALIDATION_ERROR_STATUS_CODE).send({
                message: errorValidation.errors.shift().msg,
            });
        }
        next();
    },
];

exports.resetPassword = [
    check("_id")
        .not()
        .isEmpty()
        .withMessage("User id should not be empty")
        .isMongoId()
        .withMessage("Invalid user id"),

    check("token")
        .not()
        .isEmpty()
        .withMessage("Token should not be empty"),

    check("password")
        .not()
        .isEmpty()
        .withMessage(stringFile.PASSWORD_NOT_EMPTY),

    check("_id").custom(async (value) => {
        const user = await userModel
            .findOne({ _id: value }, { _id: 1 })
            .lean()
            .catch((e) => {
                throw Error(e.message);
            });

        if (!user) throw Error("Invalid user");
        return true;
    }),

    (req, res, next) => {
        const errorValidation = validationResult(req);
        if (!errorValidation.isEmpty()) {
            return res.status(stringFile.VALIDATION_ERROR_STATUS_CODE).send({
                message: errorValidation.errors[0].msg,
            });
        }
        next();
    },
];
