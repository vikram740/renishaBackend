const dealsModel = require('../model/deals_model');

const TENURE_PREFIX = {
    daily: 'DD',
    weekly: 'WW',
    monthly: 'MM',
    quaterly: 'QY',
    halfYearly: 'HY',
    yearly: 'YY'
};

const generateDealNo = async (tenureType) => {
    const prefix = TENURE_PREFIX[tenureType];

    if (!prefix) {
        throw new Error('Invalid tenure type');
    }

    const counter = await dealsModel.findOneAndUpdate(
        { type: `DEAL_${tenureType.toUpperCase()}` }, // separate counter per tenure
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );

    return `${prefix}${String(counter.seq).padStart(4, '0')}`;
};

module.exports = generateDealNo;
