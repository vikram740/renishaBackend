const dealsModel = require("../model/deals_model");
const memberModel = require("../model/member_model");
const stringFile = require("../common/stringify.json");
const { ObjectId } = require("mongoose").Types;
require("dotenv").config();
const generateDealNo = require("../utils/generateDealId");
const { getDateFilter } = require("../utils/dashboardService");
const { dashboardAggregate } = require("../utils/dashboardService");
const agentModel = require("../model/agent_model");

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

      walletAmount: 0,
      lastPaidDate: null,
      lastInterestDate: null,
    });

    return {
      message: stringFile.SUCCESS_MESSAGE,
      data: {
        ...deal.toObject(),
        member: {
          _id: member._id,
          memberIdNo: member.memberIdNo,
        },
      },
    };
  } catch (e) {
    return { message: e.message };
  }
};

const updateDeal = async (req) => {
  try {
    const dealId = req.body.dealId || req.body._id;

    if (!dealId || !ObjectId.isValid(dealId)) {
      return { message: "Valid Deal ID is required" };
    }

    const deal = await dealsModel.findById(dealId);
    if (!deal) {
      return { message: "Deal not found" };
    }

    const updateFields = {};

    if (req.body.tenureType) updateFields.tenureType = req.body.tenureType;

    if (req.body.fromDate) {
      updateFields.fromDate = new Date(req.body.fromDate);
      updateFields.lastInterestDate = new Date(req.body.fromDate);
    }

    if (req.body.endDate) updateFields.endDate = new Date(req.body.endDate);

    if (req.body.agentNameId !== undefined)
      updateFields.agentNameId = req.body.agentNameId;

    if (req.body.tenureAmount !== undefined)
      updateFields.tenureAmount = Number(req.body.tenureAmount);

    if (req.body.percentage !== undefined)
      updateFields.percentage = Number(req.body.percentage);

    if (req.body.tenureInstallment !== undefined)
      updateFields.tenureInstallment = Number(req.body.tenureInstallment);

    const updatedDeal = await dealsModel
      .findByIdAndUpdate(dealId, { $set: updateFields }, { new: true })
      .populate("memberId", "name email memberIdNo");

    return {
      message: stringFile.SUCCESS_MESSAGE,
      data: updatedDeal,
    };
  } catch (e) {
    console.error("Error in updateDeal:", e);
    return { message: e.message || "Something went wrong" };
  }
};

const deleteDeal = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      await dealsModel
        .deleteOne({
          _id: new ObjectId(req.params._id),
        })
        .catch((e) =>
          reject({
            message: e.message,
          }),
        );
      resolve({
        message: stringFile.SUCCESS_MESSAGE,
      });
    } catch (e) {
      reject({
        message: e.message,
      });
    }
  });
};

const searchDeals = async (req) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = (
      req.body.searchString ||
      req.body.search ||
      req.query.search ||
      req.query.searchString
    )?.trim();

    const pipeline = [
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { dealIdNo: { $regex: search, $options: "i" } },
            { agentNameId: { $regex: search, $options: "i" } },
            { tenureType: { $regex: search, $options: "i" } },
            { "member.name": { $regex: search, $options: "i" } },
            { "member.email": { $regex: search, $options: "i" } },
            { "member.memberIdNo": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        list: [
          { $sort: { createdOn: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              dealIdNo: 1,
              tenureType: 1,
              agentNameId: 1,
              tenureAmount: 1,
              percentage: 1,
              tenureInstallment: 1,
              walletAmount: 1,
              lastPaidDate: 1,
              lastInterestDate: 1,
              createdOn: 1,
              memberId: "$member._id",
              memberIdNo: "$member.memberIdNo",
            },
          },
        ],
        count: [{ $count: "total" }],
      },
    });

    const result = await dealsModel.aggregate(pipeline);

    return {
      message: stringFile.SUCCESS_MESSAGE,
      data: {
        list: result[0].list,
        page,
        limit,
        total: result[0].count[0]?.total || 0,
      },
    };
  } catch (error) {
    console.error("searchDeals error:", error);
    return { message: error.message || "Something went wrong" };
  }
};

const getAllDeals = async (req) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
      { $sort: { createdOn: -1 } },

      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },

      {
        $lookup: {
          from: "dealscollections",
          let: { dealId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$dealId", "$$dealId"] },
              },
            },
            { $sort: { createdAt: -1 } },
          ],
          as: "payments",
        },
      },

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
                  in: "$$p.installmentPaidAmount",
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
}
,

      {
        $facet: {
          list: [
            { $skip: skip },
            { $limit: limit },
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
                walletAmount: 1,
                balanceAmount: 1,
                lastPaidDate: 1,

                totalPaidAmount: 1,

                pdfUrl: {
                  $concat: [
                    "/investmentPdf/",
                    { $toString: "$_id" },
                    "/",
                    { $toString: "$member._id" },
                    "/",
                    { $toString: "$nominee.nomineeId" },
                  ],
                },
                memberId: "$member._id",
                memberIdNo: "$member.memberIdNo",
                memberName: "$member.memberName",
                memberBirth: "$member.memberBirth",
                memberAdhaar: "$member.memberAdhaar",
                memberPan: "$member.memberPan",

                totalInstallmentsPaid: 1,
                paidInstallments: 1,
                totalInterest: 1,
                status:1,

                paymentMode: "$latestPayment.paymentMode",
                upiTransactionId: "$latestPayment.upiTransactionId",
                transactionId: "$latestPayment.transactionId",
                installmentNumber: "$latestPayment.installmentNumber",
                installmentPaidAmount: "$latestPayment.installmentPaidAmount",
                primaryQRCode: "$latestPayment.primaryQRCode",
                createdAt: "$latestPayment.createdAt",
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

    // const countPipeline = [{ $count: "total" }];

    // const [list, count] = await Promise.all([
    //   dealsModel.aggregate(pipeline),
    //   dealsModel.aggregate(countPipeline),
    // ]);

    // return {
    //   message: "success",
    //   list,
    //   page,
    //   limit,
    //   count: count?.[0]?.total || 0,
    // };
  } catch (e) {
    console.error("getAllDeals error:", e);
    return { message: e.message || "Something went wrong" };
  }
};

const getDealById = async (req) => {
  try {
    const { _id } = req.params;

    if (!ObjectId.isValid(_id)) {
      return { message: "Invalid Deal ID" };
    }

    const pipeline = [
      {
        $match: { _id: new ObjectId(_id) },
      },

      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },

      {
        $lookup: {
          from: "dealscollections",
          let: { dealId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$dealId", "$$dealId"] },
              },
            },
            { $sort: { createdAt: -1 } },
          ],
          as: "payments",
        },
      },

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

          paidInstallments: {
            $map: {
              input: "$paidInstallments",
              as: "p",
              in: {
                installmentNumber: "$$p.installmentNumber",
                paymentMode: { $ifNull: ["$$p.paymentMode", "cash"] },
                installmentPaidAmount: "$$p.amount",
                interest: { $ifNull: ["$$p.interest", 0] },
                paidOn: "$$p.paidOn",
              },
            },
          },

          latestPayment: { $arrayElemAt: ["$payments", 0] },
        },
      },

      {
        $project: {
          _id: 1,
          dealId: "$_id",
          dealIdNo: 1,
          type: 1,
          seq: 1,

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
          lastInterestDate: 1,
          status:1,

          totalPaidAmount: 1,

          createdOn: 1,

          /* Member details */
          memberId: "$member._id",
          memberIdNo: "$member.memberIdNo",
          memberName: "$member.memberName",
          memberBirth: "$member.memberBirth",
          memberAdhaar: "$member.memberAdhaar",
          memberPan: "$member.memberPan",
          memberEmail: "$member.memberEmail",
          memberPhone: "$member.memberPhone",

          /* Installment summary */
          totalInstallmentsPaid: 1,
          paidInstallments: 1,
          totalInterest: 1,
          interestHistory: 1, // vikram
          totalPaidAmount: 1,

          /* Latest payment details */
          paymentMode: "$latestPayment.paymentMode",
          upiTransactionId: "$latestPayment.upiTransactionId",
          transactionId: "$latestPayment.transactionId",
          installmentNumber: "$latestPayment.installmentNumber",
          installmentPaidAmount: "$latestPayment.installmentPaidAmount",
          primaryQRCode: "$latestPayment.primaryQRCode",
          paymentCreatedAt: "$latestPayment.createdAt",

          /* Optional: full payment history */
          payments: 1,
          pdfUrl: {
            $concat: [
              "/investmentPdf/",
              { $toString: "$_id" },
              "/",
              { $toString: "$member._id" },
              "/",
              { $toString: "$nominee.nomineeId" },
            ],
          },
        },
      },
    ];

    const result = await dealsModel.aggregate(pipeline);

    if (!result.length) {
      return { message: "Deal not found" };
    }

    return {
      message: "success",
      data: result[0],
    };
  } catch (error) {
    console.error("getDealById error:", error);
    return { message: error.message || "Something went wrong" };
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const { type = "overview", memberId, dealId, agentId } = req.query;
    const dateFilter = getDateFilter(req.query);

    if (memberId && !ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid memberId" });
    }

    if (dealId && !ObjectId.isValid(dealId)) {
      return res.status(400).json({ message: "Invalid dealId" });
    }

    if (agentId) {
      const agentExists = await agentModel.exists({ agentIdNo: agentId });
      if (!agentExists) {
        return res.status(404).json({ message: "Agent not found" });
      }
    }

    const data = await dashboardAggregate({
      memberId,
      dealId,
      agentId,
      dateFilter,
    });

    res.status(200).json({
      message: data.length
        ? "success"
        : "No payment details during this time period",
      count: data.length,
      data: data.length
        ? data
        : [
            {
              totalPaidAmount: 0,
              totalCollection: 0,
              totalInterestAmount: 0,
            },
          ],
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Dashboard error",
    });
  }
};

module.exports = {
  createDeals,
  getAllDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  searchDeals,
  getDashboardSummary,
};
