const dealsCollectionModel = require("../model/dealsCollection_model");

const generateTransactionId = async (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    const yearMonth = `${year}-${month}`;

    // Find latest transaction for the same month
    const lastTransaction = await dealsCollectionModel.findOne({
        transactionId: { $regex: `^${yearMonth}-` }
    })
        .sort({ createdAt: -1 }) // or _id: -1
        .select("transactionId");

    let nextSeq = 1;

    if (lastTransaction?.transactionId) {
        const lastSeq = parseInt(
            lastTransaction.transactionId.split("-")[2],
            10
        );
        nextSeq = lastSeq + 1;
    }

    const serial = String(nextSeq).padStart(4, "0");

    return `${yearMonth}-${serial}`;
};

module.exports = { generateTransactionId };