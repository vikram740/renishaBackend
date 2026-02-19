const dealsCollectionModel = require("../model/dealsCollection_model");

// format - 202602090001 for below code

const generateTransactionId = async (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const datePrefix = `${year}${month}${day}`; // 20260209

    const lastTransaction = await dealsCollectionModel.findOne({
        transactionId: { $regex: `^${datePrefix}` }
    })
        .sort({ createdAt: -1 })
        .select("transactionId");

    let nextSeq = 1;

    if (lastTransaction?.transactionId) {
        // take everything AFTER the date (not fixed length)
        const lastSeq = parseInt(
            lastTransaction.transactionId.slice(datePrefix.length),
            10
        );
        nextSeq = lastSeq + 1;
    }

    // minimum 4 digits, auto-expands after 9999
    const serial = String(nextSeq).padStart(4, "0");   // 2026020900001, ...2026020900009, 2026020900010, ...2026020900999, 026020901000... 2026020909999, 2026020910000 ..2026020910000, 2026020910001

    return `${datePrefix}${serial}`;
};





module.exports = { generateTransactionId };
