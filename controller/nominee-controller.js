const nomineeModel = require("../model/nominee_model");
const stringFile = require("../common/stringify.json");
require("dotenv").config();
const { ObjectId } = require('mongoose').Types

const getNominees = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            let nomineeList = await nomineeModel.aggregate([
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
                }
            ]).catch((e) =>
                reject({
                    message: e.message
                })
            )
            nomineeList = nomineeList[0]
            resolve({
                list: nomineeList.list,
                page,
                limit,
                count: nomineeList.count?.[0]?.totalCount || 0,
            })
        } catch (e) {
            reject({
                message: e.message
            })
        }
    })
}

const getNomineeById = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            let nominee = await nomineeModel.findOne({
                _id: new ObjectId(req.params._id)
            }).catch((e) =>
                reject({
                    message: e.message
                }))
            resolve({
                message: stringFile.SUCCESS_MESSAGE,
                user: nominee
            })

        } catch (e) {
            reject({
                message: e.message
            })
        }
    })
}

const editNominee = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const body = req.body;
            await nomineeModel.updateOne({
                _id: new ObjectId(body._id)
            }, {
                $set: req.body
            }).catch((e) =>
                reject({
                    message: e.message
                })
            )
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

const deleteNominee = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            await nomineeModel.deleteOne({
                _id: new ObjectId(req.params._id)
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

const searchNominee = (req) => {
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
                                nomineeName: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                nomineeBirth: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                nomineeAdhaar: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                nomineePhone: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                nomineeEmail: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                nomineeCurrentAddress: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                nomineePermanentAddress: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                nomineeRelationship: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            }
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
                                    nomineeName: 1,
                                    nomineeEmail: 1,
                                    nomineePhone: 1,
                                    nomineeBirth: 1,
                                    nomineeAdhaar: 1,
                                    nomineeCurrentAddress: 1,
                                    nomineePermanentAddress: 1,
                                    nomineeRelationship: 1,
                                    nomineePhoto: 1,
                                    nomineeSignature: 1,
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

            const response = await nomineeModel.aggregate(aggregateObj);

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
    getNominees,
    getNomineeById,
    editNominee,
    deleteNominee,
    searchNominee
}