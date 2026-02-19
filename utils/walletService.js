const dealsModel = require("../model/deals_model");
// const { TENURE_DAYS } = require("../utils/tenure_days");
const applyInstallmentPayment = async ({ dealId, paidAmount, paymentDate }) => {
    const deal = await dealsModel.findById(dealId);
    if (!deal) throw new Error("Deal not found");

    const amount = Number(paidAmount);
    const payDate = new Date(paymentDate);

    deal.walletAmount = Number((deal.walletAmount + amount).toFixed(2));
    deal.lastPaidDate = payDate;

    // if (!deal.lastInterestDate) {
    //     deal.lastInterestDate = payDate;
    // }
    if (!deal.lastInterestDate) {
        deal.lastInterestDate = deal.fromDate;
    }


    await deal.save();

    return {
        walletAmount: deal.walletAmount,
        interestApplied: false
    };
};

module.exports = { applyInstallmentPayment };
