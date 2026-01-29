const generateAgentId = (agentAdhaar) => {
    if (!agentAdhaar || agentAdhaar.length < 6) {
        throw new Error("Invalid agent Adhaar number");
    }

    const last6Digits = agentAdhaar.slice(-6);
    return `Aid${last6Digits}`;
};

module.exports = generateAgentId;
