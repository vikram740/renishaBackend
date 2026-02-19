const agentModel = require('../model/agent_model');
const stringFile = require('../common/stringify.json');
const md5 = require('md5');
require('dotenv').config();
const { ObjectId } = require('mongoose').Types
const generateAgentId = require('../utils/generateAgentId');


const createAgent = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const body = req.body;

            const agentIdNo = await generateAgentId(body.agentAdhaar);

            const agentPhotoFile = req.files?.agentPhoto?.[0]?.filename || null;
            const agentSignatureFile = req.files?.agentSignature?.[0]?.filename || null;

            let res = await agentModel.create({
                agentIdNo: agentIdNo,
                agentName: body.agentName,
                agentBirth: body.agentBirth,
                agentEmail: body.agentEmail,
                agentPhone: body.agentPhone,
                agentAdhaar: body.agentAdhaar,
                agentPan: body.agentPan,
                agentCurrentAddress: body.agentCurrentAddress,
                agentPermanentAddress: body.agentPermanentAddress,
                agentuserName: body.agentuserName,
                agentPassword:body.agentPassword,
                agentSignature: agentSignatureFile,
                agentPhoto: agentPhotoFile,
            }).catch((e) => {
                return reject({ message: e.message });
            });
            resolve({
                res,
                message: stringFile.SUCCESS_MESSAGE,
            });
        } catch (e) {
            reject({
                message: e.message
            });
        }
    })
}

const getAgents = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            let agentList = await agentModel.aggregate([
                {
                    $facet: {
                        list: [
                            { $sort: { _id: -1 } },
                            { $skip: skip },
                            { $limit: limit }
                        ],
                        count: [{
                            $count: 'totalCount'
                        }]
                    },
                }]).catch((e) => reject({
                    message: e.message
                }))
            agentList = agentList[0]
            resolve({
                list: agentList.list,
                page,
                limit,
                count: agentList.count?.[0]?.totalCount || 0,

            })
        } catch (e) {
            // agentList
            reject({
                message: e.message
            })
        }
    })
}

const getAgentById = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            let agent = await agentModel.findOne({
                _id: new ObjectId(req.params._id)  //agentId
            }).catch((e) =>
                reject({
                    message: e.message
                }))
            resolve({
                message: stringFile.SUCCESS_MESSAGE,
                user: agent
            })

        } catch (e) {
            reject({
                message: e.message
            })
        }
    })
}

const editAgent = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const body = req.body;
            await agentModel.updateOne({
                _id: new ObjectId(body._id)  //agentId
            }, {
                $set: req.body
            }).catch((e) =>
                reject({
                    message: e.message
                }))
            resolve({
                message: stringFile.SUCCESS_MESSAGE,
            })

        } catch (e) {
            reject({
                message: e.message
            })
        }
    })
}

const deleteAgent = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            await agentModel.deleteOne({
                _id: new ObjectId(req.params._id)  //agentId
            }).catch((e) =>
                reject({
                    message: e.message
                }))
            resolve({
                message: stringFile.SUCCESS_MESSAGE
            })

        } catch (e) {
            reject({
                message: e.message
            })
        }
    })
}

const searchAgent = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const searchString = req.body.searchString || '';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            let aggregateObj = [
                {
                    $match: {
                        $or: [
                            {
                                agentIdNo: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentName: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentBirth: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentEmail: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentPhone: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentAdhaar: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentPan: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentCurrentAddress: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentPermanentAddress: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                agentuserName: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },

                        ],
                    },
                },
                {
                    $facet: {
                        list: [
                            {
                                $sort: { _id: -1 },
                            },
                            {
                                $skip: skip,
                            },
                            {
                                $limit: limit,
                            },
                            {
                                $project: {
                                    agentIdNo: 1,
                                    agentName: 1,
                                    agentBirth: 1,
                                    agentEmail: 1,
                                    agentPhone: 1,
                                    agentAdhaar: 1,
                                    agentPan: 1,
                                    agentCurrentAddress: 1,
                                    agentPermanentAddress: 1,
                                    agentuserName: 1,
                                    agentPhoto: 1,
                                    agentSignature: 1,
                                    createdOn: 1,
                                },
                            },
                        ],
                        count: [
                            {
                                $count: 'totalCount',
                            },
                        ],
                    },
                },
            ];


            if (req.authBody?.level === 'ADMIN') {
                aggregateObj.unshift({
                    $match: {
                        adminId: ObjectId(req.authBody.adminId),
                    },
                });
            }

            const response = await agentModel.aggregate(aggregateObj);

            resolve({
                list: response[0].list,
                page,
                limit,
                count:
                    response[0].count.length > 0
                        ? response[0].count[0].totalCount
                        : 0,
            });
        } catch (e) {
            reject({ message: e.message });
        }
    });
};


module.exports = {
    createAgent,
    getAgents,
    getAgentById,
    editAgent,
    deleteAgent,
    searchAgent
}