const nomineeModel = require("../model/nominee_model");


const getNomineeById = async (nomineeId) => {
    const nominee = await nomineeModel.findById(nomineeId);
    if (!nominee) throw new Error("Nominee not found");
    return nominee;
};

module.exports = { getNomineeById };
