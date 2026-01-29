const dealsModel = require("../model/deals_model");
const memberModel = require("../model/member_model");
const stringFile = require("../common/stringify.json");
const { ObjectId } = require("mongoose").Types;
require("dotenv").config();
const generateDealNo = require('../utils/generateDealId');
const { TENURE_DAYS } = require('../utils/tenure_days');
const { applyCompoundInterest } = require('../utils/interest');
const { getMissedCycles } = require('../utils/dateCycle');
const { calculateWallet } = require('../utils/walletCalculator');


const createDeals = async (req) => {
    try {
        const body = req.body;

        if (!body.memberId || !ObjectId.isValid(body.memberId)) {
            return { message: "Valid Member ID is required" };
        }

        const member = await memberModel.findById(body.memberId);
        if (!member) {
            return { message: "Member not found" };
        }

        const dealIdNo = await generateDealNo(body.tenureType);

        const deal = await dealsModel.create({
            dealIdNo,
            memberId: body.memberId,
            tenureType: body.tenureType,
            tenurePlan: body.tenurePlan,
            fromDate: new Date(body.fromDate),
            endDate: body.endDate ? new Date(body.endDate) : null,
            agentNameId: body.agentNameId,
            tenureAmount: Number(body.tenureAmount),
            percentage: Number(body.percentage),
            tenureInstallment: Number(body.tenureInstallment),
            // dealIdNo: dealIdNo,

            // Finance fields
            walletAmount: 0,
            lastPaidDate: null,
            lastInterestDate: new Date(body.fromDate)
        });

        return {
            message: stringFile.SUCCESS_MESSAGE,
            data: deal
        };

    } catch (e) {
        return { message: e.message };
    }
};

const getAllDeals = async (req) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const dealsList = await dealsModel.aggregate([
            {
                $facet: {
                    list: [
                        { $sort: { createdOn: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: "members",
                                localField: "memberId",
                                foreignField: "_id",
                                as: "memberId"
                            }
                        },
                        { $unwind: "$memberId" },
                        {
                            $project: {
                                "memberId.memberName": 1,
                                "memberId.memberEmail": 1,
                                "memberId.memberIdNo": 1,
                                type: 1,
                                seq: 1,
                                dealIdNo: 1,
                                tenureType: 1,
                                tenurePlan: 1,
                                fromDate: 1,
                                endDate: 1,
                                agentNameId: 1,
                                tenureAmount: 1,
                                percentage: 1,
                                tenureInstallment: 1,
                                walletAmount: 1,
                                lastPaidDate: 1,
                                lastInterestDate: 1,
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

        const dealsWithWallet = dealsList[0].list.map(deal => ({
            ...deal,
            walletAmount: calculateWallet(deal)
        }));

        return {
            message: stringFile.SUCCESS_MESSAGE,
            list: dealsWithWallet,
            page,
            limit,
            count: dealsList[0].count?.[0]?.totalCount || 0
        };

    } catch (e) {
        console.error("Error in getAllDeals:", e);
        return { message: e.message || "Something went wrong" };
    }
};

const getDealById = async (req) => {
    try {
        const { _id } = req.params;
        if (!_id) return { message: "Deal ID is required" };

        const deal = await dealsModel
            .findById(_id)
            .populate('memberId', 'memberIdNo memberName memberEmail');

        if (!deal) return { message: "Deal not found" };

        // OPTIONAL preview
        const projected = calculateWallet(deal);

        return {
            message: stringFile.SUCCESS_MESSAGE,
            data: {
                ...deal.toObject(),
                walletAmount: deal.walletAmount,
                // projectedWallet: projected.wallet,       
                // projectedInterest: projected.interestApplied
            }
        };
    } catch (e) {
        console.error("Error in getDealById:", e);
        return { message: e.message || "Something went wrong" };
    }
};

const deleteDeal = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            await dealsModel.deleteOne({
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

module.exports = {
    createDeals,
    // getDeals,
    // getSingleDealById,
    // getMemberDealsById,
    deleteDeal,
    // payInstallment,
    getAllDeals,
    getDealById

};
