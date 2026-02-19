const dealsModel = require("../model/deals_model");

const switchDealToAuto = async (dealId) => {
    const deal = await dealsModel.findById(dealId);
    if (!deal) throw new Error("Deal not found");

    if (deal.interestMode === "AUTO") {
        console.log("Deal is already AUTO");
        return deal;
    }

    if (deal.status !== "ACTIVE") {
        console.log("Deal is not active. Cannot switch to AUTO");
        return deal;
    }

    const totalPaid = deal.totalInstallmentsPaid || 0;
    const totalPlan = deal.tenurePlan || 0;

    if (totalPaid >= totalPlan) {
        console.log("All installments completed. No need to switch to AUTO");
        return deal;
    }

    // Use lastPaidDate if exists, otherwise use deal start date
    const lastPaidDate = deal.lastPaidDate || deal.fromDate;
    const nextInstallmentDate = new Date(lastPaidDate);

    // Determine the frequency in days based on tenureType
    let freqDays;
    switch (deal.tenureType) {
        case "daily":
            freqDays = 1;
            break;
        case "weekly":
            freqDays = 7;
            break;
        case "monthly":
            freqDays = 30;
            break;
        case "quarterly":
            freqDays = 90;
            break;
        case "halfyearly":
            freqDays = 180;
            break;
        case "yearly":
            freqDays = 365;
            break;
        default:
            freqDays = 7; // fallback weekly
    }

    // Calculate next installment date
    nextInstallmentDate.setDate(nextInstallmentDate.getDate() + freqDays);

    // Switch deal to AUTO
    deal.interestMode = "AUTO";
    deal.nextInstallmentDate = nextInstallmentDate; // optional: store explicitly
    await deal.save();

    // console.log(
    //     [SWITCH TO AUTO] Deal ${deal._id} switched to AUTO from next installment on ${nextInstallmentDate.toISOString().split("T")[0]}
    // );

    return deal;
};


module.exports = switchDealToAuto;