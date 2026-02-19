const qrCodeModel = require('../model/qrCodes_model');
const generateQrCodeId = require('../utils/generateQrCodeId');
const { ObjectId } = require('mongoose').Types
const stringFile = require("../common/stringify.json");

const createQrCodes = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!req.files || !req.files.qrCodeFile) {
                return reject({ message: "QR Code file is required" });
            }

            const qrFile = req.files.qrCodeFile[0];

            const qrCodeId = await generateQrCodeId();

            const todayDate = new Date().toISOString().split('T')[0];

            const data = await qrCodeModel.create({
                qrCodeIdNo: qrCodeId,
                qrCodeFileName: qrFile.originalname,
                qrCodeFile: qrFile.filename,
                todayDate: todayDate
            });

            resolve({
                data,
                message: "QR Code created successfully"
            });

        } catch (e) {
            reject({
                message: e.message
            });
        }
    });
};

const getAllQrCodes = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const qrList = await qrCodeModel.aggregate([
                { $match: { qrCodeIdNo: { $ne: null } } },
                {
                    $facet: {
                        list: [
                            { $sort: { createdOn: -1 } },
                            { $skip: skip },
                            { $limit: limit }
                        ],
                        count: [
                            { $count: "totalCount" }
                        ]
                    }
                }
            ]);

            resolve({
                list: qrList[0].list,
                page,
                limit,
                count: qrList[0].count?.[0]?.totalCount || 0,
            });

        } catch (e) {
            reject({ message: e.message });
        }
    });
};


const getSingleQrCodeById = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { _id } = req.params;

            if (!ObjectId.isValid(_id)) {
                return reject({ message: "Invalid QR Code ID" });
            }

            const data = await qrCodeModel.findOne({
                _id: _id,
                qrCodeIdNo: { $ne: null }
            });

            if (!data) {
                return reject({ message: "QR Code not found" });
            }

            resolve({
                data,
                message: "QR Code fetched successfully"
            });

        } catch (e) {
            reject({ message: e.message });
        }
    });
};

const UpdateQrCodePrimary = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const _id = req.body._id || req.query._id || req.params._id;
            const qrCodeFileName = req.body.qrCodeFileName;
            const isPrimary = req.body.isPrimary;

            if (!_id || !ObjectId.isValid(_id)) {
                return reject({ message: `Invalid QR Code ID: ${_id}` });
            }

            if (isPrimary === "true" || isPrimary === true) {
                await qrCodeModel.updateMany(
                    { qrCodeIdNo: { $ne: null } },
                    { $set: { isPrimary: false } }
                );
            }

            let updateData = {
                qrCodeFileName,
                isPrimary: isPrimary === "true" || isPrimary === true
            };

            if (req.files && req.files.qrCodeFile) {
                updateData.qrCodeFile = req.files.qrCodeFile[0].filename;
            }

            const updatedQrCode = await qrCodeModel.findByIdAndUpdate(
                _id,
                updateData,
                { new: true }
            );

            if (!updatedQrCode) {
                return reject({ message: "QR Code not found" });
            }

            resolve({
                data: updatedQrCode,
                message: "QR Code updated successfully"
            });

        } catch (e) {
            reject({ message: e.message });
        }
    });
};

const deleteQRcode = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            await qrCodeModel.deleteOne({
                _id: new ObjectId(req.params._id)
            }).catch((e) => reject({
                message: e.message
            }))
            resolve({
                message: stringFile.SUCCESS_MESSAGE
            })
        } catch (e) {
            reject({
                message: e.message
            })
        }
    })
}

const searchQRcode = (req) => {
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
                    { qrCodeIdNo: { $regex: searchString, $options: 'i' } },
                    { qrCodeFileName: { $regex: searchString, $options: 'i' } },
                    { qrCodeFile: { $regex: searchString, $options: 'i' } },
                    { todayDate: { $regex: searchString, $options: 'i' } }

                ];
            }

            const response = await qrCodeModel.aggregate([
                { $match: matchStage },
                {
                    $facet: {
                        list: [
                            { $sort: { createdAt: -1 } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    qrCodeIdNo: 1,
                                    qrCodeFileName: 1,
                                    qrCodeFile: 1,
                                    todayDate: 1,
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
    createQrCodes,
    getAllQrCodes,
    getSingleQrCodeById,
    UpdateQrCodePrimary,
    deleteQRcode,
    searchQRcode
};
