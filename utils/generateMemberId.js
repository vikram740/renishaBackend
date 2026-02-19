const formatDate = (dateStr) => {
    return dateStr.replace(/[-/]/g, '');
};

const generateMemberId = ({
    memberAdhaar,
    memberJoiningDate,
    nomineeAdhaar
}) => {
    if (!memberAdhaar || !memberJoiningDate || !nomineeAdhaar) {
        throw new Error("Required fields missing for Member ID generation");
    }

    const memberAdhaarLast4 = memberAdhaar.slice(-4);
    const nomineeAdhaarLast4 = nomineeAdhaar.slice(-4);
    const joiningDateFormatted = formatDate(memberJoiningDate);

    return `${memberAdhaarLast4}${joiningDateFormatted}${nomineeAdhaarLast4}`;
};

module.exports = generateMemberId;
