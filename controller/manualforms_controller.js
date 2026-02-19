const manualFormModel = require("../model/manualForm_model");
const memberModel = require("../model/member_model");
const nomineeModel = require("../model/nominee_model");
const agentModel = require("../model/agent_model");
const dealsModel = require("../model/deals_model");
const referralModel = require("../model/referral_model");
const dealsCollectionModel = require("../model/dealsCollection_model");
const { generateTransactionId } = require("../utils/generateTransactionId");
const generateMemberId = require('../utils/generateMemberId');
const switchDealToAuto = require("../utils/switchDealToAuto");

// Utility to safely convert to number
const toNumber = (val) => {
    if (val === undefined || val === null || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

// Utility to parse date strings
const parseDate = (val) => {
    if (!val) return null;

    if (Array.isArray(val)) {
        val = val[0];
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return new Date(val);
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
        const [dd, mm, yyyy] = val.split("-");
        return new Date(`${yyyy}-${mm}-${dd}`);
    }
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;

    return null;
};

const createManualForm = async (req) => {
    try {

        /* ================= FILES ================= */
        const memberSignatureFile = req.files?.memberSignature?.[0]?.filename || null;
        const memberPhotoFile = req.files?.memberPhoto?.[0]?.filename || null;
        const memberAdhaarFile = req.files?.uploadMemberAdhaar?.[0]?.filename || null;
        const memberPanFile = req.files?.uploadMemberPan?.[0]?.filename || null;
        const nomineeSignatureFile = req.files?.nomineeSignature?.[0]?.filename || null;
        const nomineePhotoFile = req.files?.nomineePhoto?.[0]?.filename || null;

        /* ================= MEMBER ================= */
        const memberIdNo = generateMemberId({
            memberAdhaar: req.body.memberAdhaar,
            memberJoiningDate: req.body.memberJoiningDate,
            nomineeAdhaar: req.body.nomineeAdhaar
        });

        const member = {
            memberIdNo,
            memberName: req.body.memberName,
            memberEmail: req.body.memberEmail,
            memberPhone: req.body.memberPhone,
            memberBirth: req.body.memberBirth,
            memberAdhaar: req.body.memberAdhaar,
            memberPan: req.body.memberPan,
            memberCurrentAddress: req.body.memberCurrentAddress,
            memberPermanentAddress: req.body.memberPermanentAddress,
            memberJoiningDate: req.body.memberJoiningDate,
            adminId: req.body.adminId,
            memberSignature: memberSignatureFile,
            memberPhoto: memberPhotoFile,
            uploadMemberAdhaar: memberAdhaarFile,
            uploadMemberPan: memberPanFile
        };

        let memberDoc = await memberModel.findOne({ memberAdhaar: member.memberAdhaar });

        if (!memberDoc) {
            memberDoc = await memberModel.create(member);
        }

        /* ================= NOMINEE ================= */
        const nominee = {
            nomineeName: req.body.nomineeName,
            nomineeBirth: req.body.nomineeBirth,
            nomineeAdhaar: req.body.nomineeAdhaar,
            nomineePhone: req.body.nomineePhone,
            nomineeEmail: req.body.nomineeEmail,
            nomineeRelationship: req.body.nomineeRelationship,
            nomineeCurrentAddress: req.body.nomineeCurrentAddress,
            nomineePermanentAddress: req.body.nomineePermanentAddress,
            nomineeSignature: nomineeSignatureFile,
            nomineePhoto: nomineePhotoFile,
            memberId: memberDoc._id
        };

        const nomineeDoc = await nomineeModel.create(nominee);

        /* ================= AGENT ================= */
        if (!req.body.agentId) {
            throw new Error("agentId is required");
        }

        const agentDoc = await agentModel.findById(req.body.agentId);
        if (!agentDoc) {
            throw new Error("Selected agent not found");
        }

        /* ================= REFERRAL ================= */
        if (toNumber(req.body.referredAmount) > 0) {
            await referralModel.create({
                agentId: agentDoc._id,
                referredPlan: req.body.tenureType,
                referredAmount: toNumber(req.body.referredAmount),
                referredPaid: toNumber(req.body.referredPaid),
                referredPending: toNumber(req.body.referredPending)
            });
        }

        /* ================= DEAL ================= */
        const deal = {
            dealIdNo: req.body.dealIdNo,
            memberId: memberDoc._id,
            agentNameId: agentDoc.agentIdNo,

            tenureType: req.body.tenureType,
            tenurePlan: toNumber(req.body.tenurePlan),
            tenureAmount: toNumber(req.body.tenureAmount),
            percentage: toNumber(req.body.percentage),
            tenureInstallment: toNumber(req.body.tenureInstallment),

            fromDate: parseDate(req.body.fromDate),
            endDate: parseDate(req.body.endDate),

            totalInstallmentsPaid: 0,
            totalPaidAmount: 0,
            walletAmount: 0,
            balanceAmount: toNumber(req.body.tenureAmount),

            lastPaidDate: null,
            lastInterestDate: null,

            interestMode: "MANUAL",
            status: "ACTIVE"
        };

        const dealDoc = await dealsModel.create(deal);

        /* ================= OPTIONAL FIRST PAYMENT ================= */
        let paymentDoc = null;

        if (toNumber(req.body.installmentPaidAmount) > 0) {

            const paidAmount = toNumber(req.body.installmentPaidAmount);
            const paidDate = parseDate(req.body.paymentDate);

            paymentDoc = await dealsCollectionModel.create({
                dealId: dealDoc._id,
                memberId: memberDoc._id,
                agentId: agentDoc._id,
                paymentMode: (req.body.paymentMode || "cash").toLowerCase(),
                upiTransactionId:
                    req.body.paymentMode === "online"
                        ? req.body.upiTransactionId
                        : "CASH",
                installmentNumber: Number(req.body.installmentNumber),
                installmentPaidAmount: paidAmount,
                transactionId: await generateTransactionId(paidDate)
            });

            await dealsModel.findByIdAndUpdate(dealDoc._id, {
                $push: {
                    paidInstallments: {
                        installmentNumber: Number(req.body.installmentNumber),
                        amount: paidAmount,
                        paidOn: paidDate
                    }
                },
                $inc: {
                    totalInstallmentsPaid: 1,
                    totalPaidAmount: paidAmount,
                    walletAmount: paidAmount,
                    balanceAmount: -paidAmount
                },
                $set: {
                    lastPaidDate: paidDate
                }
            });
        }

        /* ================= SNAPSHOT ================= */
        await manualFormModel.create({
            memberId: memberDoc._id,
            nomineeId: nomineeDoc._id,
            agentId: agentDoc._id,
            dealId: dealDoc._id,
            dealCollectionId: paymentDoc?._id || null,

            memberSnapshot: member,
            nomineeSnapshot: nominee,
            agentSnapshot: agentDoc,
            dealSnapshot: deal,
            dealCollectionSnapshot: paymentDoc || null,

            remarks: req.body.remarks,
            enteredBy: req.user?._id
        });

        return {
            message: "Manual form created successfully",
            data: {
                member: memberDoc,
                nominee: nomineeDoc,
                agent: agentDoc,
                deal: dealDoc,
                payment: paymentDoc || null
            }
        };

    } catch (err) {
        throw err;
    }
};
const addDealTransaction = async (req) => {
    try {
        const {
            dealId,
            agentId,
            transactionType,
            amount,
            installmentNumber,
            paymentMode,
            upiTransactionId,
            transactionDate,
            interestAmount,
            lastInterestDate,
            retroInterestDates // optional array of dates for retroactive interest
        } = req.body;

        if (!dealId) throw new Error("dealId is required");
        if (!agentId) throw new Error("agentId is required");
        if (!transactionType) throw new Error("transactionType is required");

        const deal = await dealsModel.findById(dealId);
        if (!deal) throw new Error("Deal not found");

        const updates = {};
        const pushFields = {};

        /** ================= PAYMENT ================= */
        if (transactionType === "PAYMENT" || transactionType === "BOTH") {
            const amountNum = toNumber(amount);
            const installmentNum = toNumber(installmentNumber);

            if (!installmentNum) throw new Error("Installment number required for PAYMENT");

            const existing = deal.paidInstallments?.find(
                p => p.installmentNumber === installmentNum
            );
            if (existing) throw new Error(`Installment ${installmentNum} already exists`);
            const manualDate = parseDate(transactionDate) || new Date();

            await dealsCollectionModel.create({
                dealId,
                memberId: deal.memberId,
                agentId,
                paymentMode: (paymentMode || "cash").toLowerCase(),
                upiTransactionId: paymentMode === "online" ? upiTransactionId : "CASH",
                installmentNumber: installmentNum,
                installmentPaidAmount: amountNum,
                transactionId: await generateTransactionId(parseDate(transactionDate) || new Date()),
                createdAt: manualDate

            });

            pushFields.paidInstallments = {
                installmentNumber: installmentNum,
                amount: amountNum,
                paidOn: parseDate(transactionDate) || new Date()
            };

            updates.$inc = {
                totalInstallmentsPaid: 1,
                totalPaidAmount: amountNum,
                walletAmount: amountNum
            };

            updates.$set = {
                balanceAmount: deal.balanceAmount - amountNum,
                lastPaidDate: parseDate(transactionDate) || new Date()
            };
        }

        /** ================= MANUAL INTEREST ================= */
        if (transactionType === "INTEREST" || transactionType === "BOTH") {

            if (deal.interestMode === "AUTO") {
                throw new Error("Interest for AUTO deals is calculated by system");
            }

            const interestNum = toNumber(interestAmount);
            if (!interestNum || interestNum <= 0) {
                throw new Error("Valid manual interest amount required");
            }

            const interestDate = parseDate(lastInterestDate || transactionDate) || new Date();

            // ⚠️ Always fetch latest wallet (including payment in SAME request if BOTH)
            let wallet = toNumber(deal.walletAmount) + (updates.$inc?.walletAmount || 0);

            updates.$inc = updates.$inc || {};
            pushFields.interestHistory = pushFields.interestHistory || [];

            // Prevent duplicate interest for same day
            const alreadyAdded = deal.interestHistory?.some(
                i =>
                    new Date(i.date).toDateString() === interestDate.toDateString() &&
                    i.note?.includes("Manual interest")
            );

            if (alreadyAdded) {
                throw new Error("Interest already added for this date");
            }

            wallet += interestNum;

            updates.$inc.walletAmount = (updates.$inc.walletAmount || 0) + interestNum;

            pushFields.interestHistory.push({
                date: interestDate,
                interest: interestNum,
                walletAfterInterest: Math.round((wallet + Number.EPSILON) * 100) / 100,
                note: "Manual interest added on paid amount"
            });

            updates.$set = updates.$set || {};
            updates.$set.lastInterestDate = interestDate;
        }


        /** ================= UPDATE DEAL ================= */
        await dealsModel.findByIdAndUpdate(dealId, {
            ...updates,
            ...(Object.keys(pushFields).length ? { $push: pushFields } : {})
        });

        /** ================= SWITCH DEAL TO AUTO ================= */
        await switchDealToAuto(dealId);

        /** ================= FETCH UPDATED DEAL ================= */
        const updatedDeal = await dealsModel.findById(dealId).lean();

        return {
            message: "Transaction added successfully",
            walletAmount: updatedDeal.walletAmount,
            interestHistory: updatedDeal.interestHistory || [],
            totalPaidAmount: updatedDeal.totalPaidAmount,
            totalInstallmentsPaid: updatedDeal.totalInstallmentsPaid,
            balanceAmount: updatedDeal.balanceAmount
        };
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createManualForm,
    addDealTransaction

};