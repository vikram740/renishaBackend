const userModel = require("../model/user_model");
const md5 = require("md5");

const StaticUsers = async () => {
    try {
        // 🔹 Admin
        const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
        const adminExists = await userModel.findOne({ email: adminEmail });

        if (!adminExists) {
            await userModel.create({
                email: adminEmail,
                password: md5(process.env.ADMIN_PASSWORD),
                firstName: "Admin",
                lastName: "User",
                role: "admin"
            });
            console.log("Static Admin user created");
        }

        // 🔹 Agent
        const agentEmail = process.env.AGENT_EMAIL.toLowerCase().trim();
        const agentExists = await userModel.findOne({ email: agentEmail });

        if (!agentExists) {
            await userModel.create({
                email: agentEmail,
                password: md5(process.env.AGENT_PASSWORD),
                firstName: "Agent",
                lastName: "User",
                role: "agent"
            });
            console.log("Static Agent user created");
        }

    } catch (err) {
        console.error("Error seeding static users:", err.message);
    }
};

module.exports = StaticUsers;
