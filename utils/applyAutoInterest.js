// const dealsModel = require("../model/deals_model");
// const { TENURE_DAYS } = require("../utils/tenure_days");

// const DAY_MS = 24 * 60 * 60 * 1000;

// const applyAutoInterest = async () => {

//     const deals = await dealsModel.find({
//         status: "ACTIVE",
//         walletAmount: { $gt: 0 },
//         lastInterestDate: { $ne: null }
//     });

//     for (const deal of deals) {

//         const tenureDays = TENURE_DAYS[deal.tenureType];
//         if (!tenureDays) continue;

//         const rate = deal.percentage / 100;

//         const lastDate = new Date(deal.lastInterestDate);
//         lastDate.setHours(0, 0, 0, 0);

//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         const endDate = new Date(deal.endDate);
//         endDate.setHours(0, 0, 0, 0);

//         const interestUpto = today > endDate ? endDate : today;
//         if (interestUpto <= lastDate) continue;

//         const daysPassed = Math.floor(
//             (interestUpto - lastDate) / DAY_MS
//         );

//         const cyclesPassed = Math.floor(daysPassed / tenureDays);
//         if (cyclesPassed <= 0) continue;

//         let wallet = deal.walletAmount;
//         let totalInterest = 0;

//         for (let i = 1; i <= cyclesPassed; i++) {
//             const interest = Number((wallet * rate).toFixed(2));
//             wallet += interest;
//             totalInterest += interest;

//             deal.interestHistory.push({
//                 date: new Date(lastDate.getTime() + i * tenureDays * DAY_MS),
//                 interest,
//                 walletAfterInterest: wallet
//             });
//         }

//         deal.walletAmount = Number(wallet.toFixed(2));
//         deal.lastInterestDate = new Date(
//             lastDate.getTime() + cyclesPassed * tenureDays * DAY_MS
//         );

//         if (deal.lastInterestDate >= endDate) {
//             deal.status = "COMPLETED";
//         }
// //         deal.status =
// //   deal.totalPaidAmount >= deal.tenureAmount
// //     ? "COMPLETED"
// //     : "ACTIVE";


//         await deal.save();

//         console.log(
//             `[AUTO-INTEREST] Deal ${deal._id} | cycles=${cyclesPassed} | interest=${totalInterest} | wallet=${deal.walletAmount}`
//         );
//     }
// };

// module.exports = applyAutoInterest;

const dealsModel = require("../model/deals_model");
const dealsDraftModel = require("../model/dealsDraft_model");
const { TENURE_DAYS } = require("../utils/tenure_days");

const DAY_MS = 24 * 60 * 60 * 1000;

const processInterestForModel = async (Model) => {

    const deals = await Model.find({
        status: "ACTIVE",
        walletAmount: { $gt: 0 },
        lastInterestDate: { $ne: null }
    });

    for (const deal of deals) {

        const tenureDays = TENURE_DAYS[deal.tenureType];
        if (!tenureDays) continue;

        const rate = deal.percentage / 100;

        const lastDate = new Date(deal.lastInterestDate);
        lastDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = new Date(deal.endDate);
        endDate.setHours(0, 0, 0, 0);

        const interestUpto = today > endDate ? endDate : today;
        if (interestUpto <= lastDate) continue;

        const daysPassed = Math.floor(
            (interestUpto - lastDate) / DAY_MS
        );

        const cyclesPassed = Math.floor(daysPassed / tenureDays);
        if (cyclesPassed <= 0) continue;

        let wallet = deal.walletAmount;
        let totalInterest = 0;

        for (let i = 1; i <= cyclesPassed; i++) {

            const interest = Number((wallet * rate).toFixed(2));

            wallet += interest;
            totalInterest += interest;

            deal.interestHistory.push({
                date: new Date(lastDate.getTime() + i * tenureDays * DAY_MS),
                interest,
                walletAfterInterest: wallet
            });
        }

        deal.walletAmount = Number(wallet.toFixed(2));

        deal.lastInterestDate = new Date(
            lastDate.getTime() + cyclesPassed * tenureDays * DAY_MS
        );

        if (deal.lastInterestDate >= endDate) {
            deal.status = "COMPLETED";
        }

        await deal.save();

        console.log(
            `[AUTO-INTEREST] ${Model.modelName} ${deal._id} | cycles=${cyclesPassed} | interest=${totalInterest}`
        );
    }
};

const applyAutoInterest = async () => {
    await processInterestForModel(dealsModel);
    await processInterestForModel(dealsDraftModel);
};

module.exports = applyAutoInterest;
