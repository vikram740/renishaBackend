const userModel = require('../model/user_model');
const md5 = require('md5');
require('dotenv').config();
const stringFile = require('../common/stringify.json');
const jwt = require('jsonwebtoken');
const sendGrid = require("../common/sendgrid")
const { ObjectId } = require('mongoose').Types



const login = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const body = req.body;
            let res = await userModel.findOneAndUpdate(
                {
                    $and: [
                        {
                            $or: [
                                {
                                    email: body.email.toLowerCase().trim(),
                                },
                            ],
                        },
                        {
                            password: md5(body.password),
                        },
                    ],
                },
                {
                    $set: {
                        updatedAt: new Date(),
                    },
                }
            ).catch((e) => reject({
                message: e.message,
            }));
            let jwtBody = {
                _id: res._id,
                firstName: res.firstName,
                lastName: res.lastName,
                email: res.email,
                password: res.password,
                role: res.role
            };
            let token = jwt.sign(jwtBody, `${process.env.AUTHKEY}`);
            resolve({
                status: stringFile.SUCCESS_STATUS_CODE,
                message: stringFile.SUCCESS_MESSAGE,
                _id: res._id,
                firstName: res.firstName,
                lastName: res.lastName,
                email: res.email,
                password: res.password,
                role: res.role,
                token: token
            });
        } catch (e) {
            reject({
                message: e.message
            });
        }
    });
};


const signup = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const body = req.body;
            let res = await userModel.create({
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email.toLowerCase().trim(),
                password: md5(body.password),
                role: body.role
            }).catch((e) => reject({
                message: e.message
            })
            );
            let jwtBody = {
                _id: res._id,
                firstName: res.firstName,
                lastName: res.lastName,
                email: res.email,
                password: res.password,
                role: res.role
            };
            let token = jwt.sign(jwtBody, `${process.env.AUTHKEY}`);
            resolve({
                message: stringFile.SUCCESS_MESSAGE,
                _id: res._id,
                firstName: res.firstName,
                lastName: res.lastName,
                email: res.email,
                password: res.password,
                role: res.role,
                token: token,
            });
        } catch (e) {
            reject({
                message: e.message
            });
        }
    });
};


const forgotPassword = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { email } = req.body;

            const user = await userModel.findOne({ email });
            if (!user) {
                return reject({ message: "Email not registered" });
            }

            const token = jwt.sign(
                { _id: user._id },
                process.env.AUTHKEY,
                { expiresIn: "15m" }
            );

            await sendGrid.sendGrid(user.email, user._id, token);

            resolve({
                message: "Reset password link sent to your email",
            });

        } catch (e) {
            reject({ message: e.message });
        }
    });
};



const resetPassword = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { _id, token, password } = req.body;

            if (!_id || !token || !password) {
                return reject({ message: "Invalid request" });
            }

            const decoded = jwt.verify(token, process.env.AUTHKEY);

            if (decoded._id.toString() !== _id.toString()) {
                return reject({ message: "Invalid or expired token" });
            }

            const result = await userModel.updateOne(
                { _id },
                { $set: { password: md5(password) } }
            );

            if (result.modifiedCount === 0) {
                return reject({ message: "Password not updated" });
            }

            resolve({
                message: stringFile.SUCCESS_MESSAGE
            });

        } catch (e) {
            reject({ message: "Token expired or invalid" });
        }
    });
};

const usersList = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const userList = await userModel.aggregate([
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $facet: {
                        data: [
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    password: 0,
                                    __v: 0
                                }
                            }
                        ],
                        count: [
                            { $count: "totalCount" }
                        ]
                    }
                }
            ]);

            resolve({
                message: stringFile.SUCCESS_MESSAGE,
                data: userList[0]?.data || [],
                page: page,
                limit: limit,
                count: userList[0]?.count?.[0]?.totalCount || 0
            });
        } catch (e) {
            reject({
                message: e.message
            });
        }
    });
};


// with password userslist which is not good way of integrating !

// const usersList = (req) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const users = await userModel.find({})
//                 .sort({ createdAt: -1 });

//             resolve({
//                 // status: stringFile.SUCCESS_STATUS_CODE,
//                 message: stringFile.SUCCESS_MESSAGE,
//                 count: users.length,
//                 data: users
//             });
//         } catch (e) {
//             reject({
//                 message: e.message
//             });
//         }
//     });
// };



const userDetailsById = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const _id = req.params._id || req.query._id || req.body._id;

            if (!_id || !ObjectId.isValid(_id)) {
                return reject({
                    message: "Invalid user id"
                });
            }

            const user = await userModel.findOne(
                { _id },
                {
                    password: 0, // exclude password (remove this if you want password)
                    __v: 0
                }
            );

            if (!user) {
                return reject({
                    message: "User not found"
                });
            }

            resolve({
                // status: stringFile.SUCCESS_STATUS_CODE,
                message: stringFile.SUCCESS_MESSAGE,
                data: user
            });
        } catch (e) {
            reject({
                message: e.message
            });
        }
    });
};

const updateUser = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const _id = req.params._id || req.query._id || req.body._id;

            if (!_id || !ObjectId.isValid(_id)) {
                return reject({
                    message: "Invalid user id"
                });
            }

            const body = req.body;
            let updateData = {};

            if (body.firstName) updateData.firstName = body.firstName;
            if (body.lastName) updateData.lastName = body.lastName;
            if (body.email) updateData.email = body.email.toLowerCase().trim();
            if (body.role) updateData.role = body.role;

            if (body.password) {
                updateData.password = md5(body.password);
            }

            const user = await userModel.findByIdAndUpdate(
                _id,
                { $set: updateData },
                { new: true }
            ).select({ password: 0, __v: 0 });

            if (!user) {
                return reject({
                    message: "User not found"
                });
            }

            resolve({
                message: stringFile.SUCCESS_MESSAGE,
                data: user
            });
        } catch (e) {
            reject({
                message: e.message
            });
        }
    });
};

const deleteUserById = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const _id = req.params._id || req.query._id || req.body._id;

            if (!_id || !ObjectId.isValid(_id)) {
                return reject({
                    message: "Invalid user id"
                });
            }

            const user = await userModel.findByIdAndDelete(_id);

            if (!user) {
                return reject({
                    message: "User not found"
                });
            }

            resolve({
                // status: stringFile.SUCCESS_STATUS_CODE,
                message: "User deleted successfully",
                data: {
                    _id: user._id,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (e) {
            reject({
                message: e.message
            });
        }
    });
};

const searchUser = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const searchString = req.body.searchString?.trim();
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            let matchStage = {};

            if (req.authBody?.level === 'ADMIN') {
                matchStage.adminId = ObjectId(req.authBody.adminId);
            }

            if (searchString) {
                matchStage.$or = [
                    { firstName: { $regex: searchString, $options: 'i' } },
                    { lastName: { $regex: searchString, $options: 'i' } },
                    { email: { $regex: searchString, $options: 'i' } }
                ];
            }

            const response = await userModel.aggregate([
                { $match: matchStage },
                {
                    $facet: {
                        list: [
                            { $sort: { createdAt: -1 } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    email: 1,
                                    role: 1,
                                    createdAt: 1
                                }
                            }
                        ],
                        count: [
                            { $count: 'totalCount' }
                        ]
                    }
                }
            ]);

            resolve({
                list: response[0]?.list || [],
                page,
                limit,
                count: response[0]?.count?.[0]?.totalCount || 0
            });

        } catch (e) {
            reject({ message: e.message });
        }
    });
};



module.exports = {
    login,
    signup,
    forgotPassword,
    resetPassword,
    usersList,
    userDetailsById,
    deleteUserById,
    updateUser,
    searchUser
};