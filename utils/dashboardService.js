const mongoose = require("mongoose");
const dealsModel = require("../model/deals_model");
const ObjectId = mongoose.Types.ObjectId;


const getDateFilter = ({ mode, fromDate, toDate }) => {
    if (mode !== "custom") return null;
    if (!fromDate || !toDate) return null;

    const start = new Date(fromDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(toDate);
    end.setUTCHours(23, 59, 59, 999);

    return { start, end };
};
const getDealOverlapMatch = ({ start, end }) => ({
    $expr: {
        $and: [
            { $lte: ["$fromDate", end] },   // deal starts before selected end
            { $gte: ["$endDate", start] }   // deal ends after selected start
        ]
    }
});



const buildMatchStage = ({ memberId, dealId, agentId }) => {
    const match = {};

    if (memberId) match.memberId = new ObjectId(memberId);
    if (dealId) match._id = new ObjectId(dealId);   // ✅ DEAL _id
    if (agentId) {
        match.agentNameId = agentId;
    }
    return Object.keys(match).length ? { $match: match } : null;
};



const basePipeline = ({ memberId, dealId, agentId }) => {
    const matchStage = buildMatchStage({ memberId, dealId, agentId });

    return [
        ...(matchStage ? [matchStage] : []),

        // ✅ paidAmount calculated ONCE
        {
            $addFields: {
                paidAmount: {
                    $cond: [
                        { $ifNull: ["$lastPaidDate", false] },
                        "$tenureInstallment",
                        0
                    ]
                }
            }
        },

        // ✅ then unwind interest
        {
            $unwind: {
                path: "$interestHistory",
                preserveNullAndEmptyArrays: true
            }
        }
    ];
};



/* ================== PER DEAL GROUP ================== */
const perDealGroup = {
    _id: "$_id",                // DEAL _id
    memberId: { $first: "$memberId" },
    agentId: { $first: "$agentNameId" },

    paidAmount: { $first: "$paidAmount" },   // ✅ ONLY ONCE

    interestAmount: {
        $sum: { $ifNull: ["$interestHistory.interest", 0] }
    }
};





/* ================== FINAL TOTAL GROUP ================== */
const finalGroup = {
    totalPaidAmount: { $sum: "$paidAmount" },
    totalInterestAmount: { $sum: "$interestAmount" }
};


const dashboardAggregate = async ({ dateFilter, memberId, dealId, agentId }) => {
    const matchDeal = {};

    if (memberId) matchDeal.memberId = new ObjectId(memberId);
    if (dealId) matchDeal._id = new ObjectId(dealId);
    if (agentId) matchDeal.agentNameId = agentId;

    const paymentMatch = dateFilter
        ? {
            $expr: {
                $and: [
                    { $gte: ["$createdAt", dateFilter.start] },
                    { $lte: ["$createdAt", dateFilter.end] }
                ]
            }
        }
        : {};

    const pipeline = [
        { $match: matchDeal },

        /* 🔥 LOOKUP PAYMENTS WITH DATE FILTER */
        {
            $lookup: {
                from: "dealscollections",
                let: { dealId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$dealId", "$$dealId"] }
                        }
                    },
                    ...(dateFilter ? [{ $match: paymentMatch }] : [])
                ],
                as: "payments"
            }
        },

        /* ✅ KEEP ONLY DEALS THAT HAVE PAYMENTS IN RANGE */
        {
            $match: {
                "payments.0": { $exists: true }
            }
        },

        /* ✅ CALCULATE TOTALS PER DEAL */
        {
            $addFields: {
                totalPaidAmount: {
                    $sum: {
                        $map: {
                            input: "$payments",
                            as: "p",
                            in: "$$p.installmentPaidAmount"
                        }
                    }
                },
                totalCollection: "$walletAmount"
            }
        },

        /* ✅ FINAL AGGREGATION */
        {
            $group: {
                _id: null,
                totalPaidAmount: { $sum: "$totalPaidAmount" },
                totalCollection: { $sum: "$totalCollection" }
            }
        },

        {
            $project: {
                _id: 0,
                totalPaidAmount: 1,
                totalCollection: 1,
                totalInterestAmount: {
                    $subtract: ["$totalCollection", "$totalPaidAmount"]
                }
            }
        }
    ];

    return dealsModel.aggregate(pipeline);
};


module.exports = {
    dashboardAggregate,
    getDateFilter
};
