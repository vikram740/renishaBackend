const { getMissedCycles } = require('../utils/dateCycle');
const { applyCompoundInterest } = require('../utils/interest');
const { TENURE_DAYS } = require('../utils/tenure_days');

const calculateWallet = (deal, asOfDate = new Date()) => {
    if (!deal) return { wallet: 0, interestApplied: false };

    let wallet = Number(deal.walletAmount) || 0;
    if (wallet <= 0) return { wallet, interestApplied: false };

    // 🔒 Interest can ONLY start from lastInterestDate
    if (!deal.lastInterestDate) {
        return { wallet, interestApplied: false };
    }

    const interestFromDate = new Date(deal.lastInterestDate);
    if (isNaN(interestFromDate.getTime())) {
        return { wallet, interestApplied: false };
    }

    // Cap asOfDate to plan end
    const planEndDate = deal.endDate ? new Date(deal.endDate) : asOfDate;
    const asDate = new Date(Math.min(new Date(asOfDate), planEndDate));

    // Calculate completed cycles ONLY
    const cycles = getMissedCycles(
        interestFromDate,
        asDate,
        deal.tenureType
    );

    if (cycles <= 0 || !deal.percentage) {
        return { wallet, interestApplied: false };
    }

    // 🔹 Per-cycle rate (percentage is per tenure)
    const perCycleRate = deal.percentage / 100;

    wallet = applyCompoundInterest(wallet, deal.percentage, cycles);

    return {
        wallet: Number(wallet.toFixed(2)),
        interestApplied: true
    };
};

module.exports = { calculateWallet };