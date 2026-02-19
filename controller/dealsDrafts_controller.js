const dealsModel = require("../model/deals_model");
const dealsDraftModel = require("../model/dealsDraft_model");
const { ObjectId } = require("mongoose").Types;
const { getDateFilter } = require("../utils/dashboardService");
const agentModel = require("../model/agent_model");

const getAllDealsDrafts = async (req) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
      // Base filter
      {
        $match: {
          tenureAmount: { $gt: 0 },
          memberId: { $ne: null },
          status: { $in: ["ACTIVE", "COMPLETED"] },
        },
      },

      { $sort: { createdOn: -1 } },

      // Lookup draft
      {
        $lookup: {
          from: "dealsdrafts",
          localField: "_id",
          foreignField: "originalDealId",
          as: "draft",
        },
      },
      {
        $addFields: {
          draft: { $arrayElemAt: ["$draft", 0] },
        },
      },

      // Merge draft over original (KEEP original _id)
      {
        $addFields: {
          originalDealId: "$_id",
          mergedDeal: {
            $mergeObjects: ["$$ROOT", { $ifNull: ["$draft", {}] }],
          },
        },
      },
      {
        $replaceRoot: { newRoot: "$mergedDeal" },
      },

      // Member Lookup
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },

      // Nominee Lookup
      {
        $lookup: {
          from: "nominees",
          localField: "nomineeId",
          foreignField: "_id",
          as: "nominee",
        },
      },
      { $unwind: { path: "$nominee", preserveNullAndEmptyArrays: true } },

      // Payment Lookups (USING originalDealId)
      {
        $lookup: {
          from: "dealscollections",
          let: { dealId: "$originalDealId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$dealId", "$$dealId"] } } },
            { $sort: { createdAt: -1 } },
          ],
          as: "realPayments",
        },
      },
      {
        $lookup: {
          from: "dealscollectiondrafts",
          let: { dealId: "$originalDealId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$dealId", "$$dealId"] } } },
            { $sort: { createdAt: -1 } },
          ],
          as: "draftPayments",
        },
      },

      // Merge payments
      {
        $addFields: {
          payments: {
            $concatArrays: ["$realPayments", "$draftPayments"],
          },
        },
      },

      // Compute totals safely
      {
        $addFields: {
          totalInstallmentsPaid: { $size: "$payments" },
          totalPaidAmount: {
            $sum: {
              $map: {
                input: "$payments",
                as: "p",
                in: { $ifNull: ["$$p.installmentPaidAmount", 0] },
              },
            },
          },
          balanceAmount: {
            $max: [
              {
                $subtract: [
                  "$tenureAmount",
                  {
                    $sum: {
                      $map: {
                        input: "$payments",
                        as: "p",
                        in: { $ifNull: ["$$p.installmentPaidAmount", 0] },
                      },
                    },
                  },
                ],
              },
              0,
            ],
          },
          latestPayment: { $arrayElemAt: ["$payments", 0] },
        },
      },

      // Final projection
      {
        $facet: {
          list: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                dealId: {
                  $ifNull: ["$originalDealId", "$_id"],
                },

                dealIdNo: 1,
                tenureType: 1,
                tenurePlan: 1,
                tenureAmount: 1,
                percentage: 1,
                tenureInstallment: 1,
                fromDate: 1,
                endDate: 1,
                agentNameId: 1,
                walletAmount: 1,
                balanceAmount: 1,
                lastPaidDate: 1,
                totalPaidAmount: 1,
                totalInstallmentsPaid: 1,
                paidInstallments: "$payments",
                totalInterest: 1,
                status: 1,

                memberId: "$member._id",
                memberIdNo: "$member.memberIdNo",
                memberName: "$member.memberName",
                memberBirth: "$member.memberBirth",
                memberAdhaar: "$member.memberAdhaar",
                memberPan: "$member.memberPan",

                paymentMode: "$latestPayment.paymentMode",
                installmentNumber: "$latestPayment.installmentNumber",
                installmentPaidAmount: "$latestPayment.installmentPaidAmount",
                createdAt: "$latestPayment.createdAt",

                pdfUrl: {
                  $concat: [
                    "/investmentPdf/",
                    { $toString: "$originalDealId" },
                    "/",
                    { $toString: "$member._id" },
                    "/",
                  ],
                },
              },
            },
          ],
          count: [{ $count: "total" }],
        },
      },
    ];

    const result = await dealsModel.aggregate(pipeline);

    return {
      message: "success",
      list: result[0].list,
      page,
      limit,
      count: result[0].count[0]?.total || 0,
    };
  } catch (e) {
    console.error("getAllDealsDrafts error:", e);
    return { message: e.message || "Something went wrong" };
  }
};

const getDraftDealById = async (req, res) => {
  try {
    const { _id } = req.params;

    if (!ObjectId.isValid(_id)) {
      return res.status(400).send({ message: "Invalid Deal ID" });
    }

    // Try to find draft first
    let draftExists = await dealsDraftModel
      .findOne({ originalDealId: _id })
      .lean();
    let isDraft = true;
    let collection = dealsDraftModel;

    if (!draftExists) {
      // Draft not found, fallback to master deal
      const masterDealExists = await dealsModel.findById(_id).lean();
      if (!masterDealExists) {
        return res.status(404).send({ message: "Deal not found" });
      }
      draftExists = masterDealExists;
      isDraft = false;
      collection = dealsModel; // use master collection
    }

    const pipeline = [
      { $match: { _id: draftExists._id } },

      // Lookup member
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },

      // Lookup nominee
      {
        $lookup: {
          from: "nominees",
          localField: "member._id",
          foreignField: "memberId",
          as: "nominee",
        },
      },
      { $unwind: { path: "$nominee", preserveNullAndEmptyArrays: true } },

      // Lookup payments
      {
        $lookup: {
          from: "dealscollections",
          let: { dealId: "$originalDealId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$dealId", "$$dealId"] } } },
            { $sort: { createdAt: -1 } },
          ],
          as: "masterPayments",
        },
      },
      {
        $lookup: {
          from: "dealscollectiondrafts",
          let: { dealId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$dealId", "$$dealId"] } } },
            { $sort: { createdAt: -1 } },
          ],
          as: "draftPayments",
        },
      },
      {
        $addFields: {
          payments: {
            $cond: {
              if: { $gt: [{ $size: "$draftPayments" }, 0] },
              then: "$draftPayments",
              else: "$masterPayments",
            },
          },
        },
      },

      // Calculate totals
      {
        $addFields: {
          payments: { $ifNull: ["$payments", []] },
          totalInstallmentsPaid: { $size: "$payments" },
          totalPaidAmount: {
            $sum: {
              $map: {
                input: "$payments",
                as: "p",
                in: "$$p.installmentPaidAmount",
              },
            },
          },
          totalInterest: {
            $sum: {
              $map: {
                input: "$payments",
                as: "p",
                in: { $ifNull: ["$$p.interestAmount", 0] },
              },
            },
          },
          latestPayment: { $arrayElemAt: ["$payments", 0] },
          isDraft: { $literal: isDraft },
        },
      },

      // Final projection
      {
        $project: {
          _id: 1,
          dealId: "$_id",
          dealIdNo: 1,
          tenureType: 1,
          tenurePlan: 1,
          tenureAmount: 1,
          percentage: 1,
          tenureInstallment: 1,
          fromDate: 1,
          endDate: 1,
          agentNameId: 1,
          balanceAmount: { $subtract: ["$tenureAmount", "$totalPaidAmount"] },
          walletAmount: 1,
          createdOn: 1,
          totalInstallmentsPaid: 1,
          totalPaidAmount: 1,
          totalInterest: 1,
          paidInstallments: {
            $map: {
              input: "$payments",
              as: "p",
              in: {
                installmentNumber: "$$p.installmentNumber",
                paymentMode: { $ifNull: ["$$p.paymentMode", "cash"] },
                installmentPaidAmount: "$$p.installmentPaidAmount",
                interest: { $ifNull: ["$$p.interestAmount", 0] },
                paidOn: "$$p.createdAt",
              },
            },
          },
          totalInterest: {
            $sum: {
              $map: { input: "$interestHistory", as: "i", in: "$$i.interest" },
            },
          },
          paymentMode: "$latestPayment.paymentMode",
          upiTransactionId: "$latestPayment.upiTransactionId",
          transactionId: "$latestPayment.transactionId",
          installmentNumber: "$latestPayment.installmentNumber",
          installmentPaidAmount: "$latestPayment.installmentPaidAmount",
          paymentCreatedAt: "$latestPayment.createdAt",
          memberId: "$member._id",
          memberIdNo: "$member.memberIdNo",
          memberName: "$member.memberName",
          memberBirth: "$member.memberBirth",
          memberAdhaar: "$member.memberAdhaar",
          memberPan: "$member.memberPan",
          memberEmail: "$member.memberEmail",
          memberPhone: "$member.memberPhone",
          isDraft: 1,
          interestHistory: 1,
        },
      },
    ];

    const result = await collection.aggregate(pipeline);

    return res.status(200).send({ message: "success", data: result[0] });
  } catch (error) {
    console.error("getDraftDealById error:", error);
    return res
      .status(500)
      .send({ message: error.message || "Something went wrong" });
  }
};

const updateDraftPayment = async (req, res) => {
  try {
    const { dealId, updates } = req.body;

    if (!dealId) {
      return res.status(400).json({ message: "dealId is required" });
    }

    if (!updates || !updates.length) {
      return res
        .status(400)
        .json({ message: "At least one update is required" });
    }

    let draft = await dealsDraftModel.findOne({ originalDealId: dealId });

    const masterDeal = await dealsModel.findById(dealId).lean();
    if (!masterDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    if (!draft) {
      // First time → full snapshot
      const { _id, createdAt, updatedAt, __v, ...rest } = masterDeal;

      draft = await dealsDraftModel.create({
        ...rest,
        originalDealId: dealId,
        isDraft: true,
      });
    } else {
      // If draft arrays are empty but master has data → sync once
      if (
        (!draft.interestHistory || draft.interestHistory.length === 0) &&
        masterDeal.interestHistory?.length > 0
      ) {
        draft.interestHistory = JSON.parse(
          JSON.stringify(masterDeal.interestHistory),
        );
      }

      if (
        (!draft.paidInstallments || draft.paidInstallments.length === 0) &&
        masterDeal.paidInstallments?.length > 0
      ) {
        draft.paidInstallments = JSON.parse(
          JSON.stringify(masterDeal.paidInstallments),
        );
      }
    }

    // Apply manual interest updates (DRAFT ONLY)
    let earliestIndex = null;

    for (let upd of updates) {
      const index = draft.interestHistory.findIndex(
        (i) => i._id.toString() === upd.interestHistoryId,
      );

      if (index === -1 || upd.newInterest === undefined) continue;

      draft.interestHistory[index].interest = upd.newInterest;

      if (earliestIndex === null || index < earliestIndex) {
        earliestIndex = index;
      }
    }

    // Recalculate walletAfterInterest sequentially
    // Sort by date FIRST
    draft.interestHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Find earliest edited index AGAIN after sorting
    if (earliestIndex !== null) {
      earliestIndex = draft.interestHistory.findIndex((i) =>
        updates.some((u) => u.interestHistoryId === i._id.toString()),
      );
    }

    let previousWallet = 0;

    // If not first record, take wallet from previous history
    if (earliestIndex > 0) {
      previousWallet =
        draft.interestHistory[earliestIndex - 1].walletAfterInterest;
    }

    // Recalculate ONLY from edited index
    for (let i = earliestIndex; i < draft.interestHistory.length; i++) {
      const histItem = draft.interestHistory[i];

      const installment = draft.paidInstallments.find(
        (p) =>
          new Date(p.paidOn).toDateString() ===
          new Date(histItem.date).toDateString(),
      );

      const installmentAmount = installment ? installment.amount : 0;

      // Recalculate interest ONLY after edited row
      if (i !== earliestIndex) {
        histItem.interest = Number(
          (previousWallet * (draft.percentage / 100)).toFixed(6),
        );
      }

      histItem.walletAfterInterest = Number(
        (previousWallet + installmentAmount + histItem.interest).toFixed(6),
      );

      previousWallet = histItem.walletAfterInterest;
    }

    // Update totals
    draft.totalInterest = draft.interestHistory.reduce(
      (sum, i) => sum + i.interest,
      0,
    );
    draft.walletAmount = previousWallet;
    draft.balanceAmount = draft.tenureAmount - draft.totalPaidAmount;

    await draft.save();

    return res.json({
      message: "Interest history updated in draft successfully",
      draft,
    });
  } catch (err) {
    console.error("updateDraftPayment error:", err);
    return res.status(500).json({
      message: err.message || "Something went wrong",
    });
  }
};

const getDraftDashboardSummary = async (req, res) => {
  try {
    const { memberId, dealId, agentId, fromDate, toDate } = req.query;

    // Validate ObjectIds
    if (memberId && !ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid memberId" });
    }

    if (dealId && !ObjectId.isValid(dealId)) {
      return res.status(400).json({ message: "Invalid dealId" });
    }

    // Build match filter
    const matchStage = {};
    if (memberId) matchStage.memberId = new ObjectId(memberId);
    if (dealId) matchStage._id = new ObjectId(dealId);
    if (agentId) matchStage.agentNameId = agentId;

    // Build date filter
    let startDate = null;
    let endDate = null;

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const pipeline = [
      { $match: matchStage },

      // Filter installments by date
      {
        $addFields: {
          filteredPayments:
            startDate && endDate
              ? {
                  $filter: {
                    input: "$paidInstallments",
                    as: "p",
                    cond: {
                      $and: [
                        { $gte: ["$$p.paidOn", startDate] },
                        { $lte: ["$$p.paidOn", endDate] },
                      ],
                    },
                  },
                }
              : "$paidInstallments",
        },
      },

      // Keep drafts having at least one payment
      {
        $match: { "filteredPayments.0": { $exists: true } },
      },

      // Calculate totals per draft
      {
        $addFields: {
          totalPaidAmount: {
            $sum: {
              $map: {
                input: "$filteredPayments",
                as: "fp",
                in: "$$fp.amount",
              },
            },
          },
          totalCollection: "$walletAmount",
        },
      },

      // Group all drafts together
      {
        $group: {
          _id: null,
          totalPaidAmount: { $sum: "$totalPaidAmount" },
          totalCollection: { $sum: "$totalCollection" },
        },
      },

      {
        $project: {
          _id: 0,
          totalPaidAmount: { $round: ["$totalPaidAmount", 2] },
          totalCollection: { $round: ["$totalCollection", 2] },
          totalInterestAmount: {
            $round: [
              { $subtract: ["$totalCollection", "$totalPaidAmount"] },
              2,
            ],
          },
        },
      },
    ];

    const summary = await dealsDraftModel.aggregate(pipeline);

    return res.status(200).json({
      message: summary.length
        ? "success"
        : "No payment details during this time period",
      count: summary.length,
      data: summary.length
        ? summary
        : [{ totalPaidAmount: 0, totalCollection: 0, totalInterestAmount: 0 }],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  getAllDealsDrafts,
  getDraftDealById,
  updateDraftPayment,
  getDraftDashboardSummary,
};
