const agentModel = require("../model/agent_model")


const generateAgentId = async (agentAdhaar) => {
    if (!agentAdhaar || agentAdhaar.length < 4) {
        throw new Error("Invalid agent Aadhaar number");
    }

    const last4Digits = agentAdhaar.slice(-4);

    // Find last agent with same Aadhaar last-4 prefix
    const lastAgent = await agentModel.findOne({
        agentIdNo: { $regex: `^AI${last4Digits}` }
    })
        .sort({ createdAt: -1 })
        .select("agentIdNo");

    let nextSeq = 1;

    if (lastAgent?.agentIdNo) {
        const lastSeq = parseInt(
            lastAgent.agentIdNo.slice(-6), // last 6 digits
            10
        );
        nextSeq = lastSeq + 1;
    }

    const serial = String(nextSeq).padStart(6, "0");

    return `AI${last4Digits}${serial}`;     //AI1234000001, AI1234000002, ...
};

module.exports = generateAgentId;

