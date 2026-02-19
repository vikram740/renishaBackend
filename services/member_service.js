const memberModel = require("../model/member_model");

const getMemberById = async (memberId) => {
    const member = await memberModel.findById(memberId);
    if (!member) throw new Error("Member not found");
    return member;
};

module.exports = { getMemberById };
