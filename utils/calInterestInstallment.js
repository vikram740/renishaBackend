const calculateInterestForInstallment = (wallet, rate, tenureDays, lastInterestDate, paymentDate) => {
    let interest = 0;
    const asOfDate = new Date(paymentDate);

    if (wallet > 0 && lastInterestDate) {
        const diffDays = (asOfDate - lastInterestDate) / (1000 * 60 * 60 * 24);

        if (diffDays >= tenureDays) {
            interest = wallet * rate;
        }
    }

    return Number(interest.toFixed(2));
};

module.exports = { calculateInterestForInstallment };