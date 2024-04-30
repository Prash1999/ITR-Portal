const jwt = require('jsonwebtoken');
let UserService = require('../../services/common/UserService');
let userService = new UserService();

module.exports = {

    fetchUsers: async function (req, res) {
        try {
            let year = new Date().getFullYear();
            let users = await Users.find({ where: { role: { "!=": ["admin", "sub-admin"] } } });

            for (let i = 0; i < users.length; i++) {
                file = await Files.find({ where: { PAN: users[i].pancard, year: year } });

                if (file[0]) {
                    users[i].form16File = file[0].form16File;
                    users[i].year = file[0].year;
                    users[i].itrReturnedFile = file[0].itrReturnedFile;
                    users[i].status = file[0].status;
                    users[i].itrStatusFlag = file[0].status == "Complete" ? true : false;
                }
            }
            return res.status(200).send(users);
        } catch (error) {
            sails.log.error(error);
            res.status(201).send({
                error: true,
                message: "Failed to fetch users list"
            })
        }
    },

    checkItrStatus: async function (req, res) {
        try {
            let pan = req.body.pan;
            let year = new Date().getFullYear();
            let file = await Files.find({
                where: {
                    PAN: pan,
                    year: year
                }
            });

            if (file[0]) {
                return res.status(200).send({
                    itrStatusFlag: true
                });
            } else {
                return res.status(200).send({
                    itrStatusFlag: false
                });
            }
        } catch (error) {
            sails.log.error(error);
            res.status(201).send({
                error: true,
                message: "Failed to fetch ITR status"
            })
        }
    },

    fetchItrHistory: async function (req, res) {
        try {
            let files = await Files.find({
                where: { PAN: req.body.pan }
            })

            if (files.length > 0) {
                return res.status(200).send({
                    error: false,
                    files: files
                });
            } else {
                return res.status(200).send({
                    error: false,
                    message: "Failed to fetch itr history"
                });
            }
        } catch (error) {
            sails.log.error(error);
            res.status(201).send({
                error: true,
                message: "Failed to fetch ITR History"
            })
        }
    },

    changeLoginPassword: async function (req, res) {
        try {
            const reqBody = req.body;
            const tokenInfo = req.tokenInfo;
            console.log(reqBody)
            if (reqBody) {
                let userInfo = reqBody.userInfo;
                let password = userInfo.currentPassword;
                let newPassword = userInfo.newPassword;
                let confirmNewPassword = userInfo.confirmNewPassword;
                Users.find({ pancard: tokenInfo.data.pan })
                    .exec(function (err, dbUsers) {
                        if (err) {
                            sails.log.error("err is :", err);
                            return res.serverError(err);
                        }
                        console.log(dbUsers);
                        userService.isUserExist(dbUsers, req, res, password, tokenInfo.data.user)
                            .then(isValidUser => {
                                console.log(isValidUser);
                                let dbUser = dbUsers[0];
                                if (!isValidUser) {
                                    return res.status(200).send({ error: true, message: 'Current password mismatched' });
                                } else if (newPassword === confirmNewPassword) {
                                    userService.createHashedPassword(newPassword)
                                        .then(async (hashedPassword) => {
                                            console.log(hashedPassword);
                                            await Users.update({ pancard: tokenInfo.data.pan })
                                                .set({ password: hashedPassword })
                                                .exec(function (err, user) {
                                                    if (err) {
                                                        return res.serverError(err);
                                                    } else {
                                                        sails.log(req, `Password changed successfully`);
                                                        return res.status(200).send({
                                                            error: false,
                                                            message: 'Password changed successfully'
                                                        });
                                                    }
                                                });
                                        });
                                } else {
                                    return res.status(200).send({
                                        error: true,
                                        message: 'New Password and confirm password not matched'
                                    });
                                }

                            });
                    });
            }
        } catch (error) {
            sails.log.error(req, `Failed to change password: ${error}`);
            return res.serverError(error);
        }
    },

    totalClientandItrFileCount: async function (req, res) {
        try {
            const totalClients = await Users.count({ role: 'client' });
            const completeFileCount = await Files.count({ status: 'Complete' });
            const newFileCount = await Files.count({ status: 'New' });

            return res.ok({ totalClients, completeFileCount, newFileCount });
        } catch (err) {
            return res.serverError(err);
        }
    },

    fetchClientProfile: async function (req, res) {
        try {
            const userDetails = await Users.find({
                where: { pancard: req.body.pan }
            });
            console.log(req.body);
            let userDetail = userDetails[0]
            console.log(userDetail)
            return res.ok(userDetail);
        } catch (err) {
            return res.serverError(err);
        }
    },

    updateProfile: async function (req, res) {
        try {
            let reqBody = req.body;
            const tokenInfo = req.tokenInfo;
            let userName = reqBody.userName;
            let email = reqBody.email;
            let mobNo = reqBody.mobileNumber;

            await Users.update({ pancard: tokenInfo.data.pan }).set({
                userName: userName,
                email: email,
                mobileNumber: mobNo
            });

            return res.status(200).send({
                error: false,
                message: "Profile updated successfully"
            })
        } catch (err) {
            sails.log.error(error);
            res.status(201).send({
                error: true,
                message: "Failed to update user profile"
            });
        }
    },

    fetchAllUsers: async function (req, res) {
        try {
            let users = await Users.find({ where: { role: { "!=": ["admin", "sub-admin"] } } });
            let year = new Date().getFullYear();
            for (let i = 0; i < users.length; i++) {
                let file = await Files.find({
                    where: {
                        PAN: users[i].pancard,
                        year: year
                    }
                });

                if (file[0]) {
                    users[i].itrStatusFlag = true;
                } else {
                    users[i].itrStatusFlag = false;
                }
            }
            return res.status(200).send(users);
        } catch (error) {
            sails.log.error(error);
            res.status(201).send({
                error: true,
                message: "Failed to fetch users"
            })
        }
    }

};

