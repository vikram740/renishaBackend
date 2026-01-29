const { check, validationResult } = require("express-validator");
const stringFile = require("../common/stringify.json")
const md5 = require("md5");
const agentModel = require('../model/agent_model');
exports.createAgent = [
    check('agentName').not().isEmpty().withMessage(stringFile.FIRST_NAME_NOT_EMPTY),
    check('agentPhone').not().isEmpty().withMessage(stringFile.PHONENUMBER_NOT_EMPTY),
    check("agentEmail").not().isEmpty().withMessage(stringFile.EMAIL_NOT_EMPLY).isEmail().withMessage(stringFile.VALID_EMAIL_ID).trim(),
    check("agentPassword").not().isEmpty().withMessage(stringFile.PASSWORD_NOT_EMPTY),
    check("agentEmail").custom(async (value) => {
        const user = await agentModel
            .findOne(
                {
                    agentEmail: value.toLowerCase(),
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
    check("agentPhone").custom(async (value) => {
        const user = await agentModel
            .findOne(
                {
                    agentPhone: value,
                },
                {
                    _id: 1
                }
            )
            .lean()
            .catch((e) => {
                throw Error(e.message);
            });
        if (user) throw Error(stringFile.PHONE_NUMBER_UNIQUE);
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