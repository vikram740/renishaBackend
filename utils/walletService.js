const dealsModel = require("../model/deals_model");
const { TENURE_DAYS } = require("../utils/tenure_days");

const applyInstallmentPayment = async ({ dealId, paidAmount, paymentDate }) => {
    const deal = await dealsModel.findById(dealId);
    if (!deal) throw new Error("Deal not found");

    let wallet = Number(deal.walletAmount) || 0;
    const installment = Number(paidAmount);
    const asOfDate = new Date(paymentDate);

    const rate = deal.percentage / 100;
    const tenureDays = TENURE_DAYS[deal.tenureType];

    let interestApplied = false;

    const lastInterestDate = deal.lastInterestDate
        ? new Date(deal.lastInterestDate)
        : null;

    // 🔒 Apply interest ONLY if tenure completed
    if (wallet > 0 && lastInterestDate) {
        const diffDays =
            (asOfDate - lastInterestDate) / (1000 * 60 * 60 * 24);

        if (diffDays >= tenureDays) {
            wallet += wallet * rate;
            interestApplied = true;
            deal.lastInterestDate = asOfDate;
        }
    }

    // 🟢 First payment → set baseline
    if (!deal.lastInterestDate) {
        deal.lastInterestDate = asOfDate;
    }

    wallet += installment;
    wallet = Number(wallet.toFixed(2));

    deal.walletAmount = wallet;
    deal.lastPaidDate = asOfDate;

    await deal.save();

    return {
        walletAmount: wallet,
        interestApplied
    };
};

module.exports = { applyInstallmentPayment };