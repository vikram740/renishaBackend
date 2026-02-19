const collectionModel = require("../model/collection_model");
const stringFile = require("../common/stringify.json");
require("dotenv").config();
const { ObjectId } = require('mongoose').Types


const createCollection = async (req) => {
  try {
    const body = req.body;

    if (!body.memberId) {
      throw new Error("Member ID is required");
    }

    if (!ObjectId.isValid(body.memberId)) {
      throw new Error("Invalid Member ID");
    }

    const collectionDate = body.collectionDate
      ? new Date(body.collectionDate.split("-").reverse().join("-"))
      : new Date();

    const collection = await collectionModel.create({
      memberId: new ObjectId(body.memberId),
      collectionAmount: body.collectionAmount,
      collectionPercentage: body.collectionPercentage,
      collectionTransactionId: body.collectionTransactionId,
      paymentMode: body.paymentMode,
      collectionDate
    });

    const result = await collectionModel
      .findById(collection._id)
      .populate('memberId', 'memberName');

    return {
      message: "success",
      data: {
        collectionId: result._id,
        memberId: result.memberId._id,
        memberName: result.memberId.memberName,
        collectionAmount: result.collectionAmount,
        collectionPercentage: result.collectionPercentage,
        paymentMode: result.paymentMode,
        collectionDate: result.collectionDate,
        collectionTransactionId: result.collectionTransactionId
      }
    };

  } catch (e) {
    throw { message: e.message };
  }
};

const getcollections = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let collectionList = await collectionModel.aggregate([
        {
          $lookup: {
            from: 'members',
            localField: 'memberId',
            foreignField: '_id',
            as: 'member'
          }
        },
        {
          $unwind: {
            path: '$member',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            collectionAmount: 1,
            collectionPercentage: 1,
            collectionTransactionId: 1,
            paymentMode: 1,
            collectionDate: 1,
            memberId: 1,
            memberName: '$member.memberName',
            createdAt: 1
          }
        },
        {
          $facet: {
            list: [
              { $sort: { _id: -1 } },
              { $skip: skip },
              { $limit: limit }
            ],
            count: [
              { $count: 'totalCount' }
            ]
          }
        }
      ]);

      collectionList = collectionList[0];

      resolve({
        list: collectionList.list,
        page,
        limit,
        count: collectionList.count?.[0]?.totalCount || 0
      });

    } catch (e) {
      reject({ message: e.message });
    }
  });
};


const getcollectionById = async (req) => {
  try {
    const { _id } = req.params;

    if (!ObjectId.isValid(_id)) {
      throw new Error("Invalid collection ID");
    }

    const collection = await collectionModel
      .findById(_id)
      .populate('memberId', 'memberName'); // 👈 here

    if (!collection) {
      throw new Error("Collection not found");
    }

    return {
      message: stringFile.SUCCESS_MESSAGE,
      data: collection
    };

  } catch (e) {
    throw { message: e.message };
  }
};

const getCollectionByMember = async (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { memberId } = req.params;

      if (!ObjectId.isValid(memberId)) {
        return reject({ message: "Invalid member ID" });
      }

      const now = new Date();

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const startOfYear = new Date("2026-01-01");
      const endOfYear = new Date("2027-01-01");

      const result = await collectionModel.aggregate([
        {
          $match: {
            memberId: new ObjectId(memberId)
          }
        },
        {
          $facet: {
            currentMonth: [
              {
                $match: {
                  collectionDate: { $gte: startOfMonth, $lt: endOfMonth }
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: "$collectionAmount" }
                }
              }
            ],
            currentyear: [
              {
                $match: {
                  collectionDate: { $gte: startOfYear, $lt: endOfYear }
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: "$collectionAmount" }
                }
              }
            ]
          }
        }
      ]);

      resolve({
        currentMonthTotal: result[0].currentMonth[0]?.totalAmount || 0,
        currentYearTotal: result[0].currentyear[0]?.totalAmount || 0
      });
    } catch (e) {
      reject({ message: e.message });
    }
  });
};

const getCollectionDashboard = async (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const startOfYear = new Date("2026-01-01");
      const endOfYear = new Date("2027-01-01");

      const result = await collectionModel.aggregate([
        {
          $facet: {
            currentMonth: [
              {
                $match: {
                  collectionDate: { $gte: startOfMonth, $lt: endOfMonth }
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: "$collectionAmount" }
                }
              }
            ],
            currentyear: [
              {
                $match: {
                  collectionDate: { $gte: startOfYear, $lt: endOfYear }
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: "$collectionAmount" }
                }
              }
            ]
          }
        }
      ]);

      resolve({
        currentMonthTotal: result[0].currentMonth[0]?.totalAmount || 0,
        currentYearTotal: result[0].currentyear[0]?.totalAmount || 0
      });
    } catch (e) {
      reject({ message: e.message });
    }
  });
};

module.exports = {
  createCollection,
  getcollections,
  getcollectionById,
  getCollectionByMember,
  getCollectionDashboard
}