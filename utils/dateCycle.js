const { TENURE_DAYS } = require('./tenure_days');

function getMissedCycles(fromDate, toDate, tenureType) {
    if (!fromDate || !toDate) return 0;

    const cycleDays = TENURE_DAYS[tenureType];
    if (!cycleDays) return 0;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (end <= start) return 0;

    const diffDays = Math.floor(
        (end - start) / (1000 * 60 * 60 * 24)
    );

    return Math.floor(diffDays / cycleDays);
}

module.exports = {
    getMissedCycles
};