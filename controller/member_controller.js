const memberModel = require('../model/member_model');
const nomineeModel = require("../model/nominee_model");
const stringFile = require('../common/stringify.json');
require('dotenv').config();
const { ObjectId } = require('mongoose').Types
const generateMemberId = require('../utils/generateMemberId');


const createMember = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const body = req.body;
            const memberIdNo = generateMemberId({
                memberAdhaar: body.memberAdhaar,
                memberJoiningDate: body.memberJoiningDate,
                nomineeAdhaar: body.nomineeAdhaar
            });

            const memberSignatureFile = req.files?.memberSignature?.[0]?.filename || null;

            const memberPhotoFile = req.files?.memberPhoto?.[0]?.filename || null;

            const memberAdhaarFile = req.files?.uploadMemberAdhaar?.[0]?.filename || null;

            const memberPanFile = req.files?.uploadMemberPan?.[0]?.filename || null;

            const nomineeSignatureFile = req.files?.nomineeSignature?.[0]?.filename || null;

            const nomineePhotoFile = req.files?.nomineePhoto?.[0]?.filename || null;



            let memberDetails = await memberModel.create({
                memberIdNo: memberIdNo,
                memberName: body.memberName,
                memberBirth: body.memberBirth,
                memberAdhaar: body.memberAdhaar,
                memberPan: body.memberPan,
                memberPhone: body.memberPhone,
                memberEmail: body.memberEmail,
                memberCurrentAddress: body.memberCurrentAddress,
                memberPermanentAddress: body.memberPermanentAddress,
                memberJoiningDate: body.memberJoiningDate,
                memberSignature: memberSignatureFile,
                memberPhoto: memberPhotoFile,
                uploadMemberAdhaar: memberAdhaarFile,
                uploadMemberPan: memberPanFile,
                adminId: body.adminId

            }).catch((e) => {
                return reject({ message: e.message });
            });

            let nomineeDetails = await nomineeModel.create({
                nomineeName: body.nomineeName,
                nomineeBirth: body.nomineeBirth,
                nomineeAdhaar: body.nomineeAdhaar,
                nomineePhone: body.nomineePhone,
                nomineeEmail: body.nomineeEmail,
                nomineeCurrentAddress: body.nomineeCurrentAddress,
                nomineePermanentAddress: body.nomineePermanentAddress,
                nomineeRelationship: body.nomineeRelationship,
                nomineeSignature: nomineeSignatureFile,
                nomineePhoto: nomineePhotoFile,
                memberId: memberDetails._id

            }).catch((e) => {
                return reject({ message: e.message });
            });
            resolve({
                memberDetails,
                nomineeDetails,
                // memberIdNo: memberIdNo,
                message: stringFile.SUCCESS_MESSAGE
            });
        } catch (e) {
            reject({
                message: e.message
            });
        }
    })
}

const getMembers = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            let memberList = await memberModel.aggregate([
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
                }]).catch((e) =>
                    reject({
                        message: e.message
                    })
                )
            memberList = memberList[0]
            resolve({
                list: memberList.list,
                page,
                limit,
                count: memberList.count?.[0]?.totalCount || 0,
            })
        } catch (e) {
            reject({
                message: e.message
            })
        }
    })
}

const getMemberById = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            let member = await memberModel.findOne({
                _id: new ObjectId(req.params._id)
            }).catch((e) => reject({
                message: e.message
            }))
            resolve({
                message: stringFile.SUCCESS_MESSAGE,
                user: member
            })
        } catch (e) {
            reject({
                message: e.message
            })
        }
    })
}

// const editMember = (req) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const body = req.body;
//             await memberModel.updateOne({
//             }, {
//                 $set: req.body
//             }, { new: true }).catch((e) =>
//                 reject({
//                     message: e.message
//                 }))
//             resolve({
//                 message: stringFile.SUCCESS_MESSAGE,
//             })
//         } catch (e) {
//             reject({
//                 message: e.message
//             })
//         }
//     })
// }
const editMember = async (req) => {
    try {
        const { memberId } = req.params;

        if (!memberId) {
            return { message: "memberId is required" };
        }
        delete req.body._id;

        Object.keys(req.body).forEach(key => {
            if (req.body[key] === "") delete req.body[key];
        });

        const updatedMember = await memberModel.findByIdAndUpdate(
            memberId,
            { $set: req.body },
            { new: true }
        );

        if (!updatedMember) {
            return { message: "Member not found" };
        }

        return {
            message: stringFile.SUCCESS_MESSAGE,
            data: updatedMember
        };

    } catch (e) {
        return { message: e.message };
    }
};


const deleteMember = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            await memberModel.deleteOne({
                _id: new ObjectId(req.params._id)
            }).catch((e) => reject({
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

const searchMember = (req) => {
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
                                memberName: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                memberEmail: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                memberPhone: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                memberBirth: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                memberAdhaar: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                memberPan: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                memberCurrentAddress: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                memberPermanentAddress: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },
                            {
                                memberJoiningDate: {
                                    $regex: searchString,
                                    $options: 'i',
                                },
                            },

                            {
                                memberIdNo: {
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
                                    memberName: 1,
                                    memberEmail: 1,
                                    memberPhone: 1,
                                    memberIdNo: 1,
                                    memberBirth: 1,
                                    memberAdhaar: 1,
                                    memberPan: 1,
                                    memberCurrentAddress: 1,
                                    memberPermanentAddress: 1,
                                    memberJoiningDate: 1,
                                    memberPhoto: 1,
                                    memberSignature: 1,
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

            const response = await memberModel.aggregate(aggregateObj);

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
    createMember,
    getMembers,
    getMemberById,
    editMember,
    deleteMember,
    searchMember
}
