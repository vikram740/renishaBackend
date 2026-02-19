const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const commonFunction = require('./common/common_function');
require('dotenv').config();
const path = require('path');
const StaticUsers = require("./common/staticUser");
const cron = require("node-cron");
const applyAutoInterest = require("./utils/applyAutoInterest");

StaticUsers(); //static login credentials for Admin & Agent

mongoose.connect(`mongodb://${process.env.MONGO_DB_URL}/renishaFinance`, {
    connectTimeoutMS: 10000,
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api", commonFunction.jwtverification, require('./route'));


// cron.schedule("0 * * * *", async () => {
//     console.log("Running auto interest job...");       // runs zero minute of every hour but does work for all tenureDays plans
//     await applyAutoInterest();                         // If you have thousands of deals, this can be heavy on DB.
// });

cron.schedule("0 * * * *", async () => {
    console.log("Running auto interest job...");       // runs zero minute of every hour but does work for all tenureDays plans
    await applyAutoInterest();                         // If you have thousands of deals, this can be heavy on DB.
});

app.listen(process.env.PORT, (err) => {
    if (err) console.log(err);
    else console.log(`server connected at ${process.env.PORT}`);
});

module.exports = app;