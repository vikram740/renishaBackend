const getDateFilter = ({ mode, fromDate, toDate }) => {
    let start, end;
    const now = new Date();

    if (mode === "today") {
        start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);
    }

    if (mode === "week") {
        const day = now.getUTCDay();
        start = new Date(now);
        start.setUTCDate(now.getUTCDate() - day);
        start.setUTCHours(0, 0, 0, 0);
        end = new Date(start);
        end.setUTCDate(start.getUTCDate() + 7);
    }

    if (mode === "month") {
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    }

    if (mode === "year") {
        start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    }

    if (mode === "custom") {
        if (!fromDate || !toDate) return {};
        start = new Date(fromDate);
        end = new Date(toDate);
        end.setDate(end.getDate() + 1);
    }

    if (!start || !end) return {};

    return {
        "interestHistory.date": { $gte: start, $lt: end }
    };
};

module.exports = { getDateFilter };