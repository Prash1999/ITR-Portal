const AWS = require('aws-sdk');
const S3 = require('aws-sdk/clients/s3');
const s3 = new S3(sails.config.S3_CONFIG);
const sqs = new AWS.SQS(sails.config.S3_CONFIG);


module.exports = {
  uploadFiles: async function (req, res) {
    let file = req.file('file');
    let uploadedBy = req.param('uploadedBy');
    let fileName = req.param("fileName");
    let year = new Date().getFullYear();
    let uploadedFor = req.param('uploadedFor');

    let params;
    console.log(req.body);
    try {
      if (uploadedBy != 'admin') {
        console.log("in if");
        params = {
          Bucket: sails.config.S3_CONFIG.bucketName,
          Key: `ITR/${uploadedFor}/${year}/itr-upload/${fileName}`,
          Body: file._files[0].stream
        }
        s3.upload(params, async (err, data) => {
          if (err) {
            console.log(err);
            return res.status(201).send({
              error: true,
              message: "Failed to upload file"
            });
          } else {
            console.log(data);
            // Send message to SQS queue
            const queueUrl = 'https://sqs.ap-south-1.amazonaws.com/781653571934/itr-file-upload.fifo'; // Replace with your SQS queue URL
            const messageParams = {
              MessageBody: JSON.stringify({
                PAN: uploadedFor,
                year: year,
                fileName: fileName,
                versionId: data.VersionId
              }),
              QueueUrl: queueUrl,
              MessageGroupId: Date.now().toString()
            };

            sqs.sendMessage(messageParams, (err, data) => {
              if (err) {
                console.log(err);
                return res.status(201).send({
                  error: true,
                  message: "Failed to upload file"
                });
              }
            });
            sails.log.info("File uploaded successfully");
            await Files.create({
              PAN: uploadedFor,
              form16File: fileName,
              status: "New",
              year: year,
              versionForm16: data.VersionId
            });
            return res.status(200).send({
              error: false,
              message: "File uploaded successfully"
            });
          }
        });
      } else {
        params = {
          Bucket: sails.config.S3_CONFIG.bucketName,
          Key: `ITR/${uploadedFor}/${year}/itr-return-upload/${fileName}`,
          Body: file._files[0].stream
        }
        s3.upload(params, async (err, data) => {
          if (err) {
            console.log(err);
            return res.status(201).send({
              error: true,
              message: "Failed to upload file"
            });
          } else {
            console.log(data);
            const queueUrl = 'https://sqs.ap-south-1.amazonaws.com/781653571934/itr-file-upload.fifo'; // Replace with your SQS queue URL
            const messageParams = {
              MessageBody: JSON.stringify({
                PAN: uploadedFor,
                year: year,
                fileName: fileName,
                versionId: data.VersionId
              }),
              QueueUrl: queueUrl,
              MessageGroupId: Date.now().toString()
            };

            sqs.sendMessage(messageParams, (err, data) => {
              if (err) {
                console.log(err);
                return res.status(201).send({
                  error: true,
                  message: "Failed to upload file"
                });
              }
            });
            sails.log.info("File uploaded successfully");
            await Files.update({ PAN: uploadedFor, year: year }).set({ status: "Complete", itrReturnedFile: fileName, versionReturnedFile: data.VersionId });
            return res.status(200).send({
              error: false,
              message: "File uploaded successfully"
            });
          }
        });
      }
    } catch (error) {
      console.log(error);
      sails.log.error(error);
      res.status(201).send({
        error: true,
        message: "Failed to upload file"
      });
    }
  },

  downloadFile: async function (req, res) {
    let reqBody = req.body;
    let requestedBy = reqBody.requestedBy;
    let year = reqBody.year;
    let fileName = reqBody.fileName;
    let pan = reqBody.pan;
    let params;

    console.log(reqBody);
    try {
      let files = await Files.find({ where: { PAN: pan, year: year } });
      console.log(files);
      if (requestedBy != 'admin') {
        params = {
          Bucket: sails.config.S3_CONFIG.bucketName,
          Key: `ITR/${pan}/${year}/itr-return-upload/${fileName}`,
        }
      } else {
        params = {
          Bucket: sails.config.S3_CONFIG.bucketName,
          Key: `ITR/${pan}/${year}/itr-upload/${fileName}`,
        }
        if (files[0].status != "Complete")
          await Files.update({ PAN: pan, year: year }).set({ status: "In Progress" });
      }
      console.log(params);
      console.log(await s3.headObject(params).promise());
      const fileStream = await s3.getObject(params).createReadStream();
      res.set('Content-Disposition', `attachment; filename="${fileName}"`);
      res.set('Access-Control-Expose-Headers', 'Content-Disposition');
      fileStream.pipe(res);
    } catch (error) {
      // console.log(error);
      await Files.update({ PAN: pan, year: year }).set({ status: "New" });
      res.status(201).send({
        error: true,
        message: "Failed to download file"
      });
    }
  },

  filterItr: async function (req, res) {
    let reqBody = req.body;
    let year = reqBody.year;
    let status = reqBody.status;
    let pan = reqBody.pan;
    let users = [];
    try {
      let usersList;
      let files;
      if (year != "Year" && status != "Status" && pan != "") {
        usersList = await Users.find({ where: { pancard: pan } });
        for (let i = 0; i < usersList.length; i++) {
          file = await Files.find({ where: { PAN: usersList[i].pancard, year: year, status: status } });

          if (file[0]) {
            usersList[i].form16File = file[0].form16File;
            usersList[i].year = file[0].year;
            usersList[i].itrReturnedFile = file[0].itrReturnedFile;
            usersList[i].status = file[0].status;
            usersList[i].itrStatusFlag = file[0].status == "Complete" ? true : false;
            users.push(usersList[i]);
          }
        }
      } else if (year != "Year" && status != "Status" && pan == "") {
        usersList = await Users.find({ where: { role: { "!=": ["admin", "sub-admin"] } } });
        for (let i = 0; i < usersList.length; i++) {
          file = await Files.find({ where: { PAN: usersList[i].pancard, year: year, status: status } });

          if (file[0]) {
            usersList[i].form16File = file[0].form16File;
            usersList[i].year = file[0].year;
            usersList[i].itrReturnedFile = file[0].itrReturnedFile;
            usersList[i].status = file[0].status;
            usersList[i].itrStatusFlag = file[0].status == "Complete" ? true : false;
            users.push(usersList[i]);
          }
        }
      } else if (year != "Year" && pan != "" && status == "Status") {
        usersList = await Users.find({ where: { pancard: pan } });
        for (let i = 0; i < usersList.length; i++) {
          file = await Files.find({ where: { PAN: usersList[i].pancard, year: year } });

          if (file[0]) {
            usersList[i].form16File = file[0].form16File;
            usersList[i].year = file[0].year;
            usersList[i].itrReturnedFile = file[0].itrReturnedFile;
            usersList[i].status = file[0].status;
            usersList[i].itrStatusFlag = file[0].status == "Complete" ? true : false;
            users.push(usersList[i]);
          }
        }
      } else if (pan != "" && status != "Status" && year == "Year") {
        usersList = await Users.find({ where: { pancard: pan } });
        file = await Files.find({
          where: {
            PAN: usersList[0].pancard,
            status: status
          }
        });

        for (let i = 0; i < file.length; i++) {
          result = {
            userName: usersList[0].userName,
            pancard: usersList[0].pancard,
            email: usersList[0].email,
            mobileNumber: usersList[0].mobileNumber,
            form16File: file[i].form16File,
            year: file[i].year,
            itrReturnedFile: file[i].itrReturnedFile,
            status: file[i].status,
            itrStatusFlag: file[i].status == "Complete" ? true : false
          }

          users.push(result);
        }
      } else if (year != "Year" && status == "Status" && pan == "") {
        usersList = await Users.find({ where: { role: { "!=": ["admin", "sub-admin"] } } });
        for (let i = 0; i < usersList.length; i++) {
          file = await Files.find({ where: { PAN: usersList[i].pancard, year: year } });

          if (file[0]) {
            usersList[i].form16File = file[0].form16File;
            usersList[i].year = file[0].year;
            usersList[i].itrReturnedFile = file[0].itrReturnedFile;
            usersList[i].status = file[0].status;
            usersList[i].itrStatusFlag = file[0].status == "Complete" ? true : false;
            users.push(usersList[i]);
          }
        }
      } else if (status != "Status" && pan == "" && year == "Year") {
        usersList = await Users.find({ where: { role: { "!=": ["admin", "sub-admin"] } } });
        for (let i = 0; i < usersList.length; i++) {
          file = await Files.find({ where: { PAN: usersList[i].pancard, status: status } });
          if(file[0]){
            for(let j=0; j < file.length; j++){
              result = {
                userName: usersList[0].userName,
                pancard: usersList[0].pancard,
                email: usersList[0].email,
                mobileNumber: usersList[0].mobileNumber,
                form16File: file[i].form16File,
                year: file[i].year,
                itrReturnedFile: file[i].itrReturnedFile,
                status: file[i].status,
                itrStatusFlag: file[i].status == "Complete" ? true : false
              }
              users.push(result);
            }
          }
        }
      } else if (pan != "" && year == "Year" && status == "Status") {
        usersList = await Users.find({ where: { pancard: pan } });
        file = await Files.find({
          where: {
            PAN: usersList[0].pancard
          }
        });

        for (let i = 0; i < file.length; i++) {
          result = {
            userName: usersList[0].userName,
            pancard: usersList[0].pancard,
            email: usersList[0].email,
            mobileNumber: usersList[0].mobileNumber,
            form16File: file[i].form16File,
            year: file[i].year,
            itrReturnedFile: file[i].itrReturnedFile,
            status: file[i].status,
            itrStatusFlag: file[i].status == "Complete" ? true : false
          }

          users.push(result);
        }
      }

      return res.status(200).send({
        error: false,
        users: users
      });
    } catch (error) {
      console.log(error);
      res.status(201).send({
        error: true,
        message: "Failed to fetch filtered results"
      });
    }
  }
}