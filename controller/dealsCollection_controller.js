const dealsModel = require("../model/deals_model");
const memberModel = require("../model/member_model");
const dealsCollectionModel = require("../model/dealsCollection_model");
const stringFile = require("../common/stringify.json");
const { ObjectId } = require("mongoose").Types;
const { applyInstallmentPayment } = require("../utils/walletService");

const createDealsCollection = async (req) => {
    try {
        const {
            dealId,
            memberId,
            paymentMode,
            upiTransactionId,
            installmentNumber,
            amount,
            primaryQRCode
        } = req.body;

        // ✅ Validation
        if (!dealId || !ObjectId.isValid(dealId)) return { message: "Valid dealId (_id) is required" };
        if (!memberId || !ObjectId.isValid(memberId)) return { message: "Valid Member ID is required" };

        const dealObjectId = new ObjectId(dealId);
        const memberObjectId = new ObjectId(memberId);

        const deal = await dealsModel.findById(dealObjectId);
        if (!deal) return { message: "Deal not found" };

        const member = await memberModel.findById(memberObjectId);
        if (!member) return { message: "Member not found" };

        if (deal.memberId.toString() !== memberObjectId.toString()) {
            return { message: "Deal does not belong to this member" };
        }

        const isPayment = Number(amount) > 0;

        let finalUpiTransactionId = "CASH";
        let upiLast4 = "CASH";

        if (isPayment && paymentMode === "online") {
            if (!upiTransactionId) return { message: "UPI Transaction ID is required" };
            finalUpiTransactionId = upiTransactionId;
            upiLast4 = upiTransactionId.slice(-4);
        }

        let transactionId = null;
        if (isPayment) {
            const memberAdhaarLast4 = member.memberAdhaar.slice(-4);
            transactionId = `${memberAdhaarLast4}${deal.agentNameId}${upiLast4}`;
        }

        let dealCollection = null;
        let walletAmount = deal.walletAmount || 0;
        let interestApplied = false;

        if (isPayment) {
            // Save installment/payment record
            dealCollection = await dealsCollectionModel.create({
                dealId: dealObjectId,
                memberId: memberObjectId,
                paymentMode,
                upiTransactionId: finalUpiTransactionId,
                installmentNumber,
                amount,
                transactionId,
                primaryQRCode
            });

            // Apply payment + update wallet
            const walletResult = await applyInstallmentPayment({
                dealId: deal._id,
                paidAmount: amount,
                paymentDate: new Date()
            });

            walletAmount = walletResult.walletAmount;
            interestApplied = walletResult.interestApplied;
        }

        // ✅ Return structured response
        return {
            message: "success",
            data: {
                _id: dealCollection?._id || null,
                dealId: deal._id,
                dealIdNo: deal.dealIdNo,
                memberId: member._id,
                memberIdNo: member.memberIdNo,
                memberName: member.memberName,
                memberBirth: member.memberBirth,
                memberAdhaar: member.memberAdhaar,
                memberPan: member.memberPan,
                tenureType: deal.tenureType,
                tenurePlan: deal.tenurePlan,
                tenureAmount: deal.tenureAmount,
                percentage: deal.percentage,
                tenureInstallment: deal.tenureInstallment,
                fromDate: deal.fromDate,
                endDate: deal.endDate,
                agentNameId: deal.agentNameId,
                walletAmount,
                interestApplied,
                paymentMode: isPayment ? paymentMode : null,
                installmentNumber: isPayment ? installmentNumber : null,
                amount: isPayment ? amount : null,
                upiTransactionId: isPayment ? finalUpiTransactionId : null,
                transactionId,
                primaryQRCode
            }
        };

    } catch (err) {
        console.error("createDealsCollection error:", err);
        return { message: err.message || "Something went wrong" };
    }
};


const getDealsCollectionList = async (req) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const aggregatePipeline = [
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "deals",
                    localField: "dealId", //dealId
                    foreignField: "_id", //_id
                    as: "dealInfo"
                }
            },
            { $unwind: "$dealInfo" },
            {
                $lookup: {
                    from: "members",
                    localField: "memberId",
                    foreignField: "_id",
                    as: "memberInfo"
                }
            },
            { $unwind: "$memberInfo" },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: "$_id", //$dealInfo._id
                    dealId: "$dealInfo._id",
                    dealIdNo: "$dealInfo.dealIdNo",
                    memberId: "$memberInfo._id",
                    memberIdNo: "$memberInfo.memberIdNo",
                    memberName: "$memberInfo.memberName",
                    memberBirth: "$memberInfo.memberBirth",
                    memberAdhaar: "$memberInfo.memberAdhaar",
                    memberPan: "$memberInfo.memberPan",
                    tenureType: "$dealInfo.tenureType",
                    tenurePlan: "$dealInfo.tenurePlan",
                    tenureAmount: "$dealInfo.tenureAmount",
                    percentage: "$dealInfo.percentage",
                    tenureInstallment: "$dealInfo.tenureInstallment",
                    fromDate: "$dealInfo.fromDate",
                    endDate: "$dealInfo.endDate",
                    agentNameId: "$dealInfo.agentNameId",
                    paymentMode: "$paymentMode",
                    upiTransactionId: "$upiTransactionId",
                    transactionId: "$transactionId",
                    installmentNumber: "$installmentNumber",
                    amount: "$amount",
                    compoundInterest: "$compoundInterest",
                    primaryQRCode: "$primaryQRCode",
                    createdAt: "$createdAt",        // ✅ ADD THIS
                    updatedAt: "$updatedAt" 
                }
            }
        ];

        const list = await dealsCollectionModel.aggregate(aggregatePipeline);

        const countPipeline = [
            { $count: "totalCount" }
        ];
        const countResult = await dealsCollectionModel.aggregate(countPipeline);

        return {
            message: "success",
            list,
            page,
            limit,
            count: countResult?.[0]?.totalCount || 0
        };

    } catch (e) {
        console.error("Error in getDealsCollectionList:", e);
        return { message: e.message || "Something went wrong" };
    }
};

const getSingleDealCollectionByMemberId = async (req) => {
    try {
        const { memberId } = req.params;

        if (!memberId || !ObjectId.isValid(memberId)) {
            return { message: "Valid member ID is required", data: null };
        }

        const dealCollection = await dealsCollectionModel
            .findOne({ memberId })
            .sort({ installmentNumber: -1 })
            .lean();

        if (!dealCollection) {
            return { message: "Deal collection not found", data: null };
        }

        const dealInfo = await dealsModel.findOne({ memberId }).lean();
        const member = await memberModel.findById(memberId).lean();

        return {
            message: stringFile.SUCCESS_MESSAGE,
            data: {
                _id: dealInfo?._id,
                dealIdNo: dealInfo?.dealIdNo,

                memberId: member?._id,
                memberIdNo: member?.memberIdNo,
                memberName: member?.memberName,
                memberBirth: member?.memberBirth,
                memberAdhaar: member?.memberAdhaar,
                memberPan: member?.memberPan,

                tenureType: dealInfo?.tenureType,
                tenurePlan: dealInfo?.tenurePlan,
                tenureAmount: dealInfo?.tenureAmount,
                percentage: dealInfo?.percentage,
                tenureInstallment: dealInfo?.tenureInstallment,
                fromDate: dealInfo?.fromDate,
                endDate: dealInfo?.endDate,
                agentNameId: dealInfo?.agentNameId,

                installmentNumber: dealCollection.installmentNumber,
                amount: dealCollection.amount,
                compoundInterest: dealCollection.compoundInterest ?? 0,
                primaryQRCode: dealCollection.primaryQRCode,
                paymentMode: dealCollection.paymentMode,
                upiTransactionId: dealCollection.upiTransactionId,
                transactionId: dealCollection.transactionId
            }
        };
    } catch (e) {
        console.error("Error in getSingleDealCollectionByMemberId:", e);
        return { message: e.message || "Something went wrong", data: null };
    }
};

const deleteDealCollection = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            await dealsCollectionModel.deleteOne({
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
    createDealsCollection,
    getDealsCollectionList,
    getSingleDealCollectionByMemberId,
    deleteDealCollection
};
