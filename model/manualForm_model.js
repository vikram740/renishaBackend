const mongoose = require("mongoose");

const manualFormSchema = new mongoose.Schema(
    {
        memberId: { type: mongoose.Schema.Types.ObjectId, ref: "member" },
        nomineeId: { type: mongoose.Schema.Types.ObjectId, ref: "nominee" },
        agentId: { type: mongoose.Schema.Types.ObjectId, ref: "agent" },
        referralId: { type: mongoose.Schema.Types.ObjectId, ref: "referral" },
        dealId: { type: mongoose.Schema.Types.ObjectId, ref: "deals" },
        dealCollectionId: { type: mongoose.Schema.Types.ObjectId, ref: "dealsCollection" },

        // 🔹 SNAPSHOT DATA (manual entry copy)
        memberSnapshot: Object,
        nomineeSnapshot: Object,
        agentSnapshot: Object,
        dealSnapshot: Object,
        dealCollectionSnapshot: Object,

        entryType: {
            type: String,
            enum: ["MANUAL_OLD_RECORD", "SYSTEM"],
            default: "MANUAL_OLD_RECORD"
        },

        remarks: String,
        enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" }
    },
    { timestamps: true }
);

const manualFormModel = mongoose.model("manualForm", manualFormSchema);
module.exports = manualFormModel;
