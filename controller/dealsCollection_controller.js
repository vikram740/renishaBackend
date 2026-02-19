const dealsModel = require("../model/deals_model");
const memberModel = require("../model/member_model");
const dealsCollectionModel = require("../model/dealsCollection_model");
const stringFile = require("../common/stringify.json");
const { ObjectId } = require("mongoose").Types;
const { applyInstallmentPayment } = require("../utils/walletService");
const { generateTransactionId } = require("../utils/generateTransactionId");
const agentModel = require("../model/agent_model");

// const createDealsCollection = async (req) => {
//   try {
//     const {
//       dealId,
//       memberId,
//       agentId, // vikram add
//       paymentMode,
//       upiTransactionId,
//       installmentNumber,
//       installmentPaidAmount,
//       primaryQRCode,
//     } = req.body;

//     if (!dealId || !ObjectId.isValid(dealId))
//       return { message: "Valid dealId (_id) is required" };

//     if (!memberId || !ObjectId.isValid(memberId))
//       return { message: "Valid Member ID is required" };
//     if (!agentId || !ObjectId.isValid(agentId)) {
//       return { message: "Valid Agent ID is required" };
//     } // vikram add

//     const deal = await dealsModel.findById(dealId);
//     if (!deal) return { message: "Deal not found" };

//     const member = await memberModel.findById(memberId);
//     if (!member) return { message: "Member not found" };
//     const agent = await agentModel.findById(agentId);
//     if (!agent) return { message: "Agent not found" }; // vikram

//     if (deal.memberId.toString() !== memberId)
//       return { message: "Deal does not belong to this member" };

//     const isPayment = Number(installmentPaidAmount) > 0;

//     /* ---------------- VALIDATIONS ---------------- */

//     if (isPayment) {
//       if (installmentNumber === undefined || installmentNumber === null)
//         return { message: "installmentNumber is required" };

//       if (!Number.isInteger(Number(installmentNumber)))
//         return { message: "installmentNumber must be a number" };

//       // if (installmentNumber > deal.tenureInstallment)
//       //   return { message: "Installment number exceeds tenure limit" };
//       if (installmentNumber > deal.tenurePlan)
//   return { message: "Installment number exceeds tenure limit" };

//       const alreadyPaid = deal.paidInstallments?.some(
//         (i) => i.installmentNumber === Number(installmentNumber),
//       );

//       if (alreadyPaid)
//         return { message: `Installment ${installmentNumber} already paid` };
//     }

//     /* ---------------- PAYMENT META ---------------- */

//     let finalUpiTransactionId = "CASH";

//     if (isPayment && paymentMode === "online") {
//       if (!upiTransactionId)
//         return { message: "UPI Transaction ID is required" };
//       finalUpiTransactionId = upiTransactionId;
//     }

//     let transactionId = null;
//     if (isPayment) {
//       transactionId = await generateTransactionId(new Date());
//     }

//     /* ---------------- CREATE PAYMENT ---------------- */

//     let dealCollection = null;
//     let walletAmount = deal.walletAmount || 0;
//     let interestApplied = false;
//     let totalPaidAmount = deal.totalPaidAmount || 0;
//     let balanceAmount = deal.balanceAmount || deal.tenureAmount;

//     if (isPayment) {
//       /* ---------------- INSTALLMENT & AMOUNT RESTRICTIONS ---------------- */

//       const alreadyPaidCount = deal.paidInstallments?.length || 0;

//       if (alreadyPaidCount >= deal.tenurePlan) {
//         return {
//           message: `All ${deal.tenurePlan} installments are already paid`,
//         };
//       }
//       const currentTotalPaid = deal.totalPaidAmount || 0;
//       const incomingAmount = Number(installmentPaidAmount);

//       if (currentTotalPaid >= deal.tenureAmount) {
//         return {
//           message: "Tenure amount already fully paid",
//         };
//       }

//       if (currentTotalPaid + incomingAmount > deal.tenureAmount) {
//         return {
//           message: `Payment exceeds remaining due amount (${deal.tenureAmount - currentTotalPaid})`,
//         };
//       }

//       dealCollection = await dealsCollectionModel.create({
//         dealId,
//         memberId,
//         agentId, // vikram
//         paymentMode,
//         upiTransactionId: finalUpiTransactionId,
//         installmentNumber,
//         installmentPaidAmount,
//         transactionId,
//         primaryQRCode,
//       });

//       const walletResult = await applyInstallmentPayment({
//         dealId: deal._id,
//         paidAmount: installmentPaidAmount,
//         paymentDate: dealCollection.createdAt,
//       });

//       walletAmount = walletResult.walletAmount;
//       interestApplied = walletResult.interestApplied;

//       deal.paidInstallments.push({
//         installmentNumber: Number(installmentNumber),
//         amount: Number(installmentPaidAmount),
//         paymentMode: paymentMode, //vikram
//         paidOn: dealCollection.createdAt,
//       });

//       totalPaidAmount = deal.paidInstallments.reduce(
//         (sum, i) => sum + Number(i.amount || 0),
//         0,
//       );

//       // balanceAmount = Number(deal.tenureAmount) - totalPaidAmount;

//       deal.totalPaidAmount = totalPaidAmount;
//      deal.balanceAmount = Math.max(
//   Number(deal.tenureAmount) - totalPaidAmount,
//   0
// );

//       deal.totalInstallmentsPaid = deal.paidInstallments.length;
//       deal.walletAmount = walletAmount;
//       deal.lastPaidDate = dealCollection.createdAt;

//       // if (deal.totalInstallmentsPaid === deal.tenureInstallment) {
//       //   deal.status = "COMPLETED";
//       // }
//       if (deal.totalPaidAmount >= deal.tenureAmount) {
//         deal.status = "COMPLETED";
//       } else {
//         deal.status = "ACTIVE";
//       }

//       await deal.save();
//     }

//     /* ---------------- RESPONSE ---------------- */

//     return {
//       message: "success",
//       data: {
//         _id: dealCollection?._id || null,
//         dealId: deal._id,
//         dealIdNo: deal.dealIdNo,
//         memberId: member._id,
//         memberIdNo: member.memberIdNo,
//         memberName: member.memberName,
//         agentId: agent._id, // vikram
//         agentIdNo: agent.agentIdNo, // vikram
//         tenureType: deal.tenureType,
//         tenurePlan: deal.tenurePlan,
//         tenureAmount: deal.tenureAmount,
//         tenureInstallment: deal.tenureInstallment,
//         totalPaidAmount,
//         balanceAmount,
//         walletAmount,
//         interestApplied,
//         totalInstallmentsPaid: deal.totalInstallmentsPaid,
//         paidInstallments: deal.paidInstallments.map((i) => i.installmentNumber),
//         installmentNumber,
//         installmentPaidAmount,
//         paymentMode,
//         upiTransactionId: finalUpiTransactionId,
//         transactionId,
//         primaryQRCode,
//         lastPaidDate: deal.lastPaidDate, // deal summary
//         // paymentDate: dealCollection?.createdAt || null
//       },
//     };
//   } catch (err) {
//     console.error("createDealsCollection error:", err);
//     return { message: err.message || "Something went wrong" };
//   }
// };
const createDealsCollection = async (req) => {
  try {
    const {
      dealId,
      memberId,
      agentId,
      paymentMode,
      upiTransactionId,
      installmentNumber,
      installmentPaidAmount,
      primaryQRCode,
    } = req.body;

    if (!dealId || !ObjectId.isValid(dealId))
      return { message: "Valid dealId is required" };

    const deal = await dealsModel.findById(dealId);
    if (!deal) return { message: "Deal not found" };

    const incomingAmount = Number(installmentPaidAmount);
    if (incomingAmount <= 0)
      return { message: "Amount must be greater than 0" };

    if (deal.totalPaidAmount + incomingAmount > deal.tenureAmount)
      return { message: "Payment exceeds remaining due amount" };

    const transactionId = await generateTransactionId(new Date());

    const dealCollection = await dealsCollectionModel.create({
      dealId,
      memberId,
      agentId,
      paymentMode,
      upiTransactionId: paymentMode === "online" ? upiTransactionId : "CASH",
      installmentNumber,
      installmentPaidAmount: incomingAmount,
      transactionId,
      primaryQRCode,
    });

    // 🔥 APPLY INTEREST + WALLET LOGIC
    const walletResult = await applyInstallmentPayment({
      dealId: deal._id,
      paidAmount: incomingAmount,
      paymentDate: dealCollection.createdAt,
    });

    deal.paidInstallments.push({
      installmentNumber,
      amount: incomingAmount,
      paymentMode,
      paidOn: dealCollection.createdAt,
    });

    const totalPaidAmount = deal.paidInstallments.reduce(
      (sum, i) => sum + Number(i.amount || 0),
      0,
    );

    deal.totalPaidAmount = totalPaidAmount;

    deal.balanceAmount = Math.max(deal.tenureAmount - totalPaidAmount, 0);

    deal.totalInstallmentsPaid = deal.paidInstallments.length;

    deal.walletAmount = walletResult.walletAmount; // 🔥 FIXED
    deal.lastPaidDate = dealCollection.createdAt;

    const today = new Date();

    deal.status =
      deal.endDate &&
      today >= new Date(deal.endDate) &&
      deal.totalInstallmentsPaid >= deal.tenurePlan
        ? "COMPLETED"
        : "ACTIVE";

    await deal.save();

    return {
      message: "success",
      data: deal,
    };
  } catch (error) {
    return { message: error.message };
  }
};

const getDealsCollectionList = async (req) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
      { $sort: { createdAt: -1 } },

      /* -------- Deal lookup -------- */
      {
        $lookup: {
          from: "deals",
          localField: "dealId",
          foreignField: "_id",
          as: "dealInfo",
        },
      },
      { $unwind: "$dealInfo" },

      /* -------- Member lookup -------- */
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "memberInfo",
        },
      },
      { $unwind: "$memberInfo" },
      /* -------- Agents fields -------- */ // vikram
      {
        $lookup: {
          from: "agents",
          localField: "agentId",
          foreignField: "_id",
          as: "agentInfo",
        },
      },
      { $unwind: "$agentInfo" },

      /* -------- Derived fields -------- */
      {
        $addFields: {
          totalInstallmentsPaid: {
            $ifNull: ["$dealInfo.totalInstallmentsPaid", 0],
          },
          paidInstallments: {
            $map: {
              input: { $ifNull: ["$dealInfo.paidInstallments", []] },
              as: "pi",
              in: "$$pi.installmentNumber",
            },
          },
          totalInterest: {
            $ifNull: [{ $sum: "$dealInfo.interestHistory.interest" }, 0],
          },
        },
      },
      /* -------- Wallet calculation -------- */
      {
        $addFields: {
          walletAmountCalculated: {
            $add: [
              { $ifNull: ["$dealInfo.totalPaidAmount", 0] }, // principal
              { $ifNull: ["$totalInterest", 0] }, // interest
            ],
          },
        },
      },

      /* -------- Pagination -------- */
      { $skip: skip },
      { $limit: limit },

      /* -------- Final shape -------- */
      {
        $project: {
          _id: 1,

          /* Deal */
          dealId: "$dealInfo._id",
          dealIdNo: "$dealInfo.dealIdNo",
          tenureType: "$dealInfo.tenureType",
          tenurePlan: "$dealInfo.tenurePlan",
          tenureAmount: "$dealInfo.tenureAmount",
          percentage: "$dealInfo.percentage",
          tenureInstallment: "$dealInfo.tenureInstallment",
          fromDate: "$dealInfo.fromDate",
          endDate: "$dealInfo.endDate",
          agentDealCreatedNameId: "$dealInfo.agentNameId", // vikram
          // walletAmount: "$dealInfo.walletAmount",
          walletAmount: "$walletAmountCalculated",

          balanceAmount: { $ifNull: ["$dealInfo.balanceAmount", 0] },
          lastPaidDate: "$dealInfo.lastPaidDate",

          /* Installments summary */
          totalInstallmentsPaid: 1,
          paidInstallments: 1,

          /* Member */
          memberId: "$memberInfo._id",
          memberIdNo: "$memberInfo.memberIdNo",
          memberName: "$memberInfo.memberName",
          memberBirth: "$memberInfo.memberBirth",
          memberAdhaar: "$memberInfo.memberAdhaar",
          memberPan: "$memberInfo.memberPan",

          /**agent  */ // vikram
          agentId: "$agentInfo._id",
          agentNameId: "$agentInfo.agentName",
          agentIdNo: "$agentInfo.agentIdNo",

          /* Payment row */
          paymentMode: 1,
          upiTransactionId: 1,
          transactionId: 1,
          installmentNumber: 1,
          installmentPaidAmount: 1,
          primaryQRCode: 1,
          createdAt: 1,

          /* Calculated */
          totalInterest: 1,
        },
      },
    ];

    const countPipeline = [
      {
        $lookup: {
          from: "deals",
          localField: "dealId",
          foreignField: "_id",
          as: "dealInfo",
        },
      },
      { $unwind: "$dealInfo" },
      { $count: "totalCount" },
    ];

    const [list, countResult] = await Promise.all([
      dealsCollectionModel.aggregate(pipeline),
      dealsCollectionModel.aggregate(countPipeline),
    ]);

    return {
      message: "success",
      list,
      page,
      limit,
      count: countResult?.[0]?.totalCount || 0,
    };
  } catch (e) {
    console.error("Error in getDealsCollectionList:", e);
    return { message: e.message || "Something went wrong" };
  }
};

const getSingleDealCollectionById = async (req) => {
  try {
    const { collectionId } = req.params;

    if (!collectionId || !ObjectId.isValid(collectionId)) {
      return { message: "Valid collectionId is required", data: null };
    }

    const pipeline = [
      { $match: { _id: new ObjectId(collectionId) } },

      /* -------- Deal -------- */
      {
        $lookup: {
          from: "deals",
          localField: "dealId",
          foreignField: "_id",
          as: "dealInfo",
        },
      },
      { $unwind: { path: "$dealInfo", preserveNullAndEmptyArrays: true } },

      /* -------- OLD: Payment summary (RESTORED) -------- */
      {
        $lookup: {
          from: "dealscollections",
          let: { dealId: "$dealId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$dealId", "$$dealId"] },
              },
            },
            {
              $group: {
                _id: "$dealId",
                totalPaidAmount: {
                  $sum: { $toDouble: "$installmentPaidAmount" },
                },
              },
            },
          ],
          as: "paymentSummary",
        },
      },

      /* -------- ADD FIELDS (old + new) -------- */
      {
        $addFields: {
          /* OLD */
          totalPaidAmount: {
            $ifNull: [
              { $arrayElemAt: ["$paymentSummary.totalPaidAmount", 0] },
              0,
            ],
          },
          totalInterest: {
            $ifNull: [{ $sum: "$dealInfo.interestHistory.interest" }, 0],
          },

          /* NEW */
          totalInstallmentsPaid: {
            $ifNull: ["$dealInfo.totalInstallmentsPaid", 0],
          },
          paidInstallments: {
            $map: {
              input: { $ifNull: ["$dealInfo.paidInstallments", []] },
              as: "pi",
              in: "$$pi.installmentNumber",
            },
          },
        },
      },

      /* -------- Member -------- */
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "memberInfo",
        },
      },
      { $unwind: { path: "$memberInfo", preserveNullAndEmptyArrays: true } },

      /*------Agent-------- */ // vikram
      {
        $lookup: {
          from: "agents",
          localField: "agentId",
          foreignField: "_id",
          as: "agentInfo",
        },
      },
      { $unwind: { path: "$agentInfo", preserveNullAndEmptyArrays: true } },

      /* -------- Projection -------- */
      {
        $project: {
          _id: 1,

          /* Deal */
          dealId: "$dealInfo._id",
          dealIdNo: "$dealInfo.dealIdNo",
          tenureType: "$dealInfo.tenureType",
          tenurePlan: "$dealInfo.tenurePlan",
          tenureAmount: "$dealInfo.tenureAmount",
          percentage: "$dealInfo.percentage",
          tenureInstallment: "$dealInfo.tenureInstallment",
          fromDate: "$dealInfo.fromDate",
          endDate: "$dealInfo.endDate",
          agentDealCreateNameId: "$dealInfo.agentNameId", // vikram
          walletAmount: { $ifNull: ["$dealInfo.walletAmount", 0] },
          balanceAmount: { $ifNull: ["$dealInfo.balanceAmount", 0] },
          lastPaidDate: "$dealInfo.lastPaidDate",

          /* OLD calculated */
          totalPaidAmount: 1,
          totalInterest: 1,

          /* NEW installment fields */
          totalInstallmentsPaid: 1,
          paidInstallments: 1,

          /* Member */
          memberId: "$memberInfo._id",
          memberIdNo: "$memberInfo.memberIdNo",
          memberName: "$memberInfo.memberName",
          memberBirth: "$memberInfo.memberBirth",
          memberAdhaar: "$memberInfo.memberAdhaar",
          memberPan: "$memberInfo.memberPan",

          /*Agents */ // vikram

          agentId: "$agentInfo._id",
          agentNameId: "$agentInfo.agentName",
          agentIdNo: "$agentInfo.agentIdNo",

          /* Payment */
          paymentMode: 1,
          installmentNumber: 1,
          installmentPaidAmount: 1,
          upiTransactionId: 1,
          transactionId: 1,
          primaryQRCode: 1,
          createdAt: 1,
        },
      },
    ];

    const result = await dealsCollectionModel.aggregate(pipeline);

    if (!result.length) {
      return { message: "Deal collection not found", data: null };
    }

    return { message: "success", data: result[0] };
  } catch (e) {
    console.error("Error in getSingleDealCollectionById:", e);
    return { message: e.message || "Something went wrong", data: null };
  }
};

const updateSingleDealCollection = async (req) => {
  try {
    const {
      collectionId,
      paymentMode,
      upiTransactionId,
      installmentPaidAmount,
      primaryQRCode,
    } = req.body;

    if (!collectionId || !ObjectId.isValid(collectionId)) {
      return { message: "Valid collectionId is required", data: null };
    }

    const dealCollection = await dealsCollectionModel.findById(collectionId);
    if (!dealCollection) {
      return { message: "Deal collection not found", data: null };
    }

    const updateFields = {};

    if (paymentMode) {
      updateFields.paymentMode = paymentMode;

      if (paymentMode === "online") {
        if (!upiTransactionId) {
          return {
            message: "UPI Transaction ID is required for online payments",
            data: null,
          };
        }
        updateFields.upiTransactionId = upiTransactionId;
      } else {
        updateFields.upiTransactionId = "CASH";
      }
    }

    if (installmentPaidAmount !== undefined) {
      if (Number(installmentPaidAmount) <= 0) {
        return { message: "Amount must be greater than 0", data: null };
      }
      updateFields.installmentPaidAmount = Number(installmentPaidAmount);
    }

    if (primaryQRCode) {
      updateFields.primaryQRCode = primaryQRCode;
    }

    const updatedCollection = await dealsCollectionModel.findByIdAndUpdate(
      collectionId,
      { $set: updateFields },
      { new: true },
    );

    return {
      message: stringFile.SUCCESS_MESSAGE,
      data: {
        _id: updatedCollection._id,
        paymentMode: updatedCollection.paymentMode,
        upiTransactionId: updatedCollection.upiTransactionId,
        transactionId: updatedCollection.transactionId,
        installmentNumber: updatedCollection.installmentNumber,
        installmentPaidAmount: updatedCollection.installmentPaidAmount,
        primaryQRCode: updatedCollection.primaryQRCode,
        createdAt: updatedCollection.createdAt,
      },
    };
  } catch (e) {
    console.error("Error in updateDealCollectionById:", e);
    return { message: e.message || "Something went wrong", data: null };
  }
};

// const recalculateDeal = async (dealId) => {
//   const payments = await dealsCollectionModel.find({ dealId });

//   const deal = await dealsModel.findById(dealId);
//   if (!deal) return;

//   const paidInstallments = payments.map((p) => ({
//     installmentNumber: p.installmentNumber,
//     amount: Number(p.installmentPaidAmount),
//     paymentMode: p.paymentMode,
//     paidOn: p.createdAt,
//   }));

//   const totalPrincipalPaid = paidInstallments.reduce(
//     (sum, p) => sum + p.amount,
//     0,
//   );

//   const totalInterest = Array.isArray(deal.interestHistory)
//     ? deal.interestHistory.reduce((sum, i) => sum + Number(i.interest || 0), 0)
//     : 0;

//   deal.paidInstallments = paidInstallments;
//   deal.totalInstallmentsPaid = paidInstallments.length;
//   deal.totalPaidAmount = totalPrincipalPaid;

//   deal.walletAmount = totalPrincipalPaid + totalInterest;

//   deal.balanceAmount = Math.max(
//     Number(deal.tenureAmount) - totalPrincipalPaid,
//     0,
//   );

//   deal.status =
//     deal.totalPaidAmount >= deal.tenureAmount ? "COMPLETED" : "ACTIVE";

//   await deal.save();
// };
const recalculateDeal = async (dealId) => {
  const deal = await dealsModel.findById(dealId);
  if (!deal) return;

  // const payments = await dealsCollectionModel.find({ dealId });
  const payments = await dealsCollectionModel
    .find({ dealId })
    .sort({ createdAt: 1 }); // IMPORTANT

  const totalPrincipalPaid = payments.reduce(
    (sum, p) => sum + Number(p.installmentPaidAmount || 0),
    0,
  );

  deal.paidInstallments = payments.map((p) => ({
    installmentNumber: p.installmentNumber,
    amount: Number(p.installmentPaidAmount),
    paymentMode: p.paymentMode,
    paidOn: p.createdAt,
  }));

  deal.totalPaidAmount = totalPrincipalPaid;

  // 🔥 Calculate total interest from interestHistory
  const totalInterest = Array.isArray(deal.interestHistory)
    ? deal.interestHistory.reduce((sum, i) => sum + Number(i.interest || 0), 0)
    : 0;

  deal.walletAmount = totalPrincipalPaid + totalInterest;

  deal.balanceAmount = Math.max(deal.tenureAmount - totalPrincipalPaid, 0);

  deal.totalInstallmentsPaid = payments.length;

  const today = new Date();

  deal.status =
    deal.endDate &&
    today >= new Date(deal.endDate) &&
    deal.totalInstallmentsPaid >= deal.tenurePlan
      ? "COMPLETED"
      : "ACTIVE";

  await deal.save();
};

const deleteDealCollection = async (req) => {
  try {
    const { collectionId } = req.params;

    if (!collectionId || !ObjectId.isValid(collectionId)) {
      return { message: "Valid collectionId is required" };
    }

    const collection = await dealsCollectionModel.findById(collectionId);
    if (!collection) {
      return { message: "Deal collection not found" };
    }

    const dealId = collection.dealId;

    await dealsCollectionModel.deleteOne({ _id: collection._id });

    await recalculateDeal(dealId);

    return { message: stringFile.SUCCESS_MESSAGE };
  } catch (e) {
    console.error("Error in deleteDealCollection:", e);
    return { message: e.message || "Something went wrong" };
  }
};

const searchDealCollections = async (req) => {
  try {
    const { searchString = "", page = 1, limit = 10 } = req.body;
    const skip = (page - 1) * limit;

    const regex = new RegExp(searchString.trim(), "i");

    const pipeline = [
      {
        $lookup: {
          from: "deals",
          localField: "dealId",
          foreignField: "_id",
          as: "dealInfo",
        },
      },
      { $unwind: "$dealInfo" },

      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "memberInfo",
        },
      },
      { $unwind: "$memberInfo" },

      // vikram
      {
        $lookup: {
          from: "agents",
          localField: "agentId",
          foreignField: "_id",
          as: "agentInfo",
        },
      },

      ...(searchString
        ? [
            {
              $match: {
                $or: [
                  { upiTransactionId: regex },
                  { paymentMode: regex },
                  { primaryQRCode: regex },
                  { transactionId: regex },
                  { "dealInfo.dealIdNo": regex },
                  { "memberInfo.memberName": regex },
                  { "memberInfo.memberIdNo": regex },
                  { "memberInfo.memberAdhaar": regex },
                  { "memberInfo.memberPan": regex },
                ],
              },
            },
          ]
        : []),

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },

      {
        $project: {
          _id: 1,
          paymentMode: 1,
          upiTransactionId: 1,
          transactionId: 1,
          installmentNumber: 1,
          installmentPaidAmount: 1,
          primaryQRCode: 1,
          createdAt: 1,
          dealId: "$dealInfo._id",
          dealIdNo: "$dealInfo.dealIdNo",
          tenureType: "$dealInfo.tenureType",
          tenurePlan: "$dealInfo.tenurePlan",
          tenureAmount: "$dealInfo.tenureAmount",
          percentage: "$dealInfo.percentage",
          tenureInstallment: "$dealInfo.tenureInstallment",
          fromDate: "$dealInfo.fromDate",
          endDate: "$dealInfo.endDate",
          agentDealCreateNameId: "$dealInfo.agentNameId", // vikram
          walletAmount: "$dealInfo.walletAmount",
          memberId: "$memberInfo._id",
          memberIdNo: "$memberInfo.memberIdNo",
          memberName: "$memberInfo.memberName",
          memberBirth: "$memberInfo.memberBirth",
          memberAdhaar: "$memberInfo.memberAdhaar",
          memberPan: "$memberInfo.memberPan",
          agentId: "$agentInfo._id", // vikram
          agentNameId: "$agentInfo.agentName", // vikram
          agentIdNo: "$agentInfo.agentIdNo", // vikram
        },
      },
    ];

    const list = await dealsCollectionModel.aggregate(pipeline);

    const countPipeline = [
      {
        $lookup: {
          from: "deals",
          localField: "dealId",
          foreignField: "_id",
          as: "dealInfo",
        },
      },
      { $unwind: "$dealInfo" },
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "memberInfo",
        },
      },
      { $unwind: "$memberInfo" },
      ...(searchString
        ? [
            {
              $match: {
                $or: [
                  { upiTransactionId: regex },
                  { paymentMode: regex },
                  { primaryQRCode: regex },
                  { transactionId: regex },
                  { "dealInfo.dealIdNo": regex },
                  { "memberInfo.memberName": regex },
                  { "memberInfo.memberIdNo": regex },
                  { "memberInfo.memberAdhaar": regex },
                  { "memberInfo.memberPan": regex },
                ],
              },
            },
          ]
        : []),
      { $count: "totalCount" },
    ];

    const countResult = await dealsCollectionModel.aggregate(countPipeline);

    return {
      message: "success",
      list,
      page: parseInt(page),
      limit: parseInt(limit),
      count: countResult?.[0]?.totalCount || 0,
    };
  } catch (e) {
    console.error("Error in searchDealCollections:", e);
    return { message: e.message || "Something went wrong", list: [] };
  }
};

const getDealInstallments = async (req) => {
  const { _id } = req.params;

  const deal = await dealsModel.findById(_id);
  if (!deal) return { message: "Deal not found" };

  //   const installments = await dealsCollectionModel
  //     .find({ dealId: _id })
  //     .sort({ createdAt: 1 });

  // vikram adding
  const installments = await dealsCollectionModel.aggregate([
    { $match: { dealId: new ObjectId(_id) } },
    { $sort: { createdAt: 1 } },

    // Member lookup
    {
      $lookup: {
        from: "members",
        localField: "memberId",
        foreignField: "_id",
        as: "memberInfo",
      },
    },
    { $unwind: { path: "$memberInfo", preserveNullAndEmptyArrays: true } },

    // Agent lookup
    {
      $lookup: {
        from: "agents",
        localField: "agentId",
        foreignField: "_id",
        as: "agentInfo",
      },
    },
    { $unwind: { path: "$agentInfo", preserveNullAndEmptyArrays: true } },

    // Final shape
    {
      $project: {
        _id: 1,
        dealId: deal._id,
        dealIdNo: deal.dealIdNo,
        installmentNumber: 1,
        installmentPaidAmount: 1,
        paymentMode: 1,
        upiTransactionId: 1,
        transactionId: 1,
        primaryQRCode: 1,

        createdAt: 1,

        memberId: 1,
        memberIdNo: "$memberInfo.memberIdNo",

        agentId: 1,
        agentIdNo: "$agentInfo.agentIdNo",
      },
    },
  ]);

  return {
    message: "success",
    totalInstallments: installments.length,
    totalPaidAmount: installments.reduce(
      (sum, i) => sum + Number(i.installmentPaidAmount || 0),
      0,
    ),
    walletAmount: deal.walletAmount,
    interestHistory: deal.interestHistory,
    installments,
  };
};

module.exports = {
  createDealsCollection,
  getDealsCollectionList,
  getSingleDealCollectionById,
  updateSingleDealCollection,
  deleteDealCollection,
  searchDealCollections,
  getDealInstallments,
};
