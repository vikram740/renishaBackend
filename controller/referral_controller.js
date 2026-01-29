const referralModel = require("../model/referral_model");
const stringFile = require("../common/stringify.json");
require("dotenv").config();
const { ObjectId } = require('mongoose').Types
const agentModel = require('../model/agent_model');


const createReferralAgent = async (req) => {
    try {
        let { agentId, referredPlan, referredAmount, referredPaid } = req.body;

        if (!agentId || !ObjectId.isValid(agentId)) {
            return { message: "Valid Agent ID is required" };
        }

        const agent = await agentModel.findById(agentId);
        if (!agent) {
            return { message: "Agent not found" };
        }

        referredAmount = Number(referredAmount) || 0;
        referredPaid = Number(referredPaid) || 0;

        const referredPending = referredAmount - referredPaid;

        const referral = await referralModel.create({
            agentId: new ObjectId(agentId),
            referredAmount,
            referredPlan,
            referredPaid,
            referredPending
        });

        await referral.populate('agentId');

        return {
            message: stringFile.SUCCESS_MESSAGE,
            data: {
                _id: referral._id,
                // agentId: agent._id,
                agentNameId: agent.agentIdNo,
                agentName: agent.agentName,
                agentPhone: agent.agentPhone,
                agentEmail: agent.agentEmail,
                agentBirth: agent.agentBirth,
                agentAdhaar: agent.agentAdhaar,
                agentPan: agent.agentPan,
                referredPlan,
                referredAmount,
                referredPaid,
                referredPending,
                createdOn: referral.createdOn
            }
        };

    } catch (e) {
        console.error("Error in createReferralAgent:", e);
        return { message: e.message || "Something went wrong" };
    }
};

const getReferrals = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            let referralList = await referralModel.aggregate([
                {
                    $lookup: {
                        from: "agents",
                        localField: "agentId",
                        foreignField: "_id",
                        as: "agent"
                    }
                },
                { $unwind: "$agent" },
                { $sort: { _id: -1 } },
                {
                    $facet: {
                        list: [
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    _id: 1,
                                    agentNameId: "$agent.agentIdNo",
                                    agentName: "$agent.agentName",
                                    agentPhone: "$agent.agentPhone",
                                    agentEmail: "$agent.agentEmail",
                                    agentBirth: "$agent.agentBirth",
                                    agentAdhaar: "$agent.agentAdhaar",
                                    agentPan: "$agent.agentPan",
                                    referredPlan: 1,
                                    referredAmount: 1,
                                    referredPaid: 1,
                                    referredPending: 1,
                                    createdOn: 1
                                }
                            }
                        ],
                        count: [
                            { $count: "totalCount" }
                        ]
                    }
                }
            ]);

            referralList = referralList[0];

            resolve({
                list: referralList.list,
                page,
                limit,
                count: referralList.count?.[0]?.totalCount || 0,
            });

        } catch (e) {
            reject({ message: e.message });
        }
    });
};


const getReferralById = async (req) => {
    try {
        const { _id } = req.params
        if (!_id || !ObjectId.isValid(_id)) {
            return { message: "Valid Referral ID is required" };
        }

        const referral = await referralModel
            .findById(_id)
            .populate("agentId");

        if (!referral) {
            return { message: "Referral not found" };
        }

        return {
            message: stringFile.SUCCESS_MESSAGE,
            data: {
                _id: referral._id,
                agentNameId: referral.agentId.agentIdNo,
                agentName: referral.agentId.agentName,
                agentPhone: referral.agentId.agentPhone,
                agentEmail: referral.agentId.agentEmail,
                agentBirth: referral.agentId.agentBirth,
                agentAdhaar: referral.agentId.agentAdhaar,
                agentPan: referral.agentId.agentPan,
                referredPlan: referral.referredPlan,
                referredAmount: referral.referredAmount,
                referredPaid: referral.referredPaid,
                referredPending: referral.referredPending,
                createdOn: referral.createdOn
            }
        };

    } catch (e) {
        console.error("Error in getReferralById:", e);
        return { message: e.message || "Something went wrong" };
    }
};


const editReferral = async (req) => {
    try {
        const { _id, referredPlan, referredAmount, referredPaid } = req.body;

        if (!_id || !ObjectId.isValid(_id)) {
            return { message: "Valid Referral ID is required" };
        }

        const updatedFields = {};
        if (referredPlan !== undefined) updatedFields.referredPlan = referredPlan;
        if (referredAmount !== undefined) updatedFields.referredAmount = Number(referredAmount);
        if (referredPaid !== undefined) updatedFields.referredPaid = Number(referredPaid);

        if (updatedFields.referredAmount !== undefined || updatedFields.referredPaid !== undefined) {
            const referral = await referralModel.findById(_id);
            const newAmount = updatedFields.referredAmount ?? referral.referredAmount;
            const newPaid = updatedFields.referredPaid ?? referral.referredPaid;
            updatedFields.referredPending = newAmount - newPaid;
        }

        const updatedReferral = await referralModel.findByIdAndUpdate(
            _id,
            { $set: updatedFields },
            { new: true }
        ).populate("agentId");

        if (!updatedReferral) {
            return { message: "Referral not found" };
        }

        return {
            message: stringFile.SUCCESS_MESSAGE,
            data: {
                _id: updatedReferral._id,
                agentNameId: updatedReferral.agentId.agentIdNo,
                agentName: updatedReferral.agentId.agentName,
                agentPhone: updatedReferral.agentId.agentPhone,
                agentEmail: updatedReferral.agentId.agentEmail,
                agentBirth: updatedReferral.agentId.agentBirth,
                agentAdhaar: updatedReferral.agentId.agentAdhaar,
                agentPan: updatedReferral.agentId.agentPan,
                referredPlan: updatedReferral.referredPlan,
                referredAmount: updatedReferral.referredAmount,
                referredPaid: updatedReferral.referredPaid,
                referredPending: updatedReferral.referredPending,
                createdOn: updatedReferral.createdOn
            }
        };

    } catch (e) {
        console.error("Error in editReferral:", e);
        return { message: e.message || "Something went wrong" };
    }
};

const deleteReferral = async (req) => {
    try {
        const { _id } = req.params;

        if (!_id || !ObjectId.isValid(_id)) {
            return { message: "Valid Referral ID is required" };
        }

        const result = await referralModel.deleteOne({ _id: new ObjectId(_id) });

        if (result.deletedCount === 0) {
            return { message: "Referral not found" };
        }

        return { message: stringFile.SUCCESS_MESSAGE };

    } catch (e) {
        console.error("Error in deleteReferral:", e);
        return { message: e.message || "Something went wrong" };
    }
};

const searchReferralAgent = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const searchString = (req.body.searchString || "").trim();
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // numeric detection
            const numericSearch = !isNaN(searchString) && searchString !== ""
                ? Number(searchString)
                : null;

            const pipeline = [
                {
                    $lookup: {
                        from: "agents",
                        localField: "agentId",
                        foreignField: "_id",
                        as: "agent"
                    }
                },
                { $unwind: "$agent" },

                // 🔥 Convert numbers to string for regex search
                {
                    $addFields: {
                        referredAmountStr: { $toString: "$referredAmount" },
                        referredPaidStr: { $toString: "$referredPaid" },
                        referredPendingStr: { $toString: "$referredPending" },
                        referredPlanStr: { $toString: "$referredPlan" }

                    }
                },

                // 🔍 Search filter
                searchString
                    ? {
                        $match: {
                            $or: [
                                { referredPlan: { $regex: searchString } },
                                { referredAmountStr: { $regex: searchString } },
                                { referredPaidStr: { $regex: searchString } },
                                { referredPendingStr: { $regex: searchString } },

                                { "agent.agentIdNo": { $regex: searchString, $options: "i" } },
                                { "agent.agentName": { $regex: searchString, $options: "i" } },
                                { "agent.agentPhone": { $regex: searchString, $options: "i" } },
                                { "agent.agentEmail": { $regex: searchString, $options: "i" } },
                                { "agent.agentAdhaar": { $regex: searchString, $options: "i" } },
                                { "agent.agentPan": { $regex: searchString, $options: "i" } },
                                { "agent.agentBirth": { $regex: searchString, $options: "i" } },

                                ...(numericSearch !== null ? [
                                    { referredAmount: numericSearch },
                                    { referredPaid: numericSearch },
                                    { referredPending: numericSearch },
                                    { referredPlan: numericSearch },

                                ] : [])
                            ]
                        }
                    }
                    : { $match: {} },

                { $sort: { _id: -1 } },

                {
                    $facet: {
                        list: [
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    _id: 1,

                                    // 🔹 Agent fields (same as CREATE / GET)
                                    agentNameId: "$agent.agentIdNo",
                                    agentName: "$agent.agentName",
                                    agentPhone: "$agent.agentPhone",
                                    agentEmail: "$agent.agentEmail",
                                    agentBirth: "$agent.agentBirth",
                                    agentAdhaar: "$agent.agentAdhaar",
                                    agentPan: "$agent.agentPan",

                                    // 🔹 Referral fields
                                    referredPlan: 1,
                                    referredAmount: 1,
                                    referredPaid: 1,
                                    referredPending: 1,
                                    createdOn: 1
                                }
                            }
                        ],
                        count: [{ $count: "totalCount" }]
                    }
                }
            ];

            const result = await referralModel.aggregate(pipeline);

            resolve({
                message: stringFile.SUCCESS_MESSAGE,
                list: result[0]?.list || [],
                page,
                limit,
                count: result[0]?.count?.[0]?.totalCount || 0
            });

        } catch (e) {
            reject({ message: e.message });
        }
    });
};

module.exports = {
    createReferralAgent,
    getReferrals,
    getReferralById,
    editReferral,
    deleteReferral,
    searchReferralAgent
}