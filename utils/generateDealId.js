const dealsModel = require('../model/deals_model');

const TENURE_PREFIX = {
    daily: "DD",
    weekly: "WW",
    monthly: "MM",
    quarterly: "QY",
    halfyearly: "HY",
    yearly: "YY"
};

const generateDealNo = async (tenureType) => {
    const prefix = TENURE_PREFIX[tenureType];

    if (!prefix) {
        throw new Error("Invalid tenure type");
    }

    const counter = await dealsModel.findOneAndUpdate(
        { type: `DEAL_${tenureType.toUpperCase()}` },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );

    return `${prefix}${String(counter.seq).padStart(6, "0")}`;         //WW000001, DD000001, MM000001, QY000001, HY000001, YY000001
};

module.exports = generateDealNo;

