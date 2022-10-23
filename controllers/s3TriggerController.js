
const s3 = require('../services/s3');

const uniqid = require('uniqid');
const fs = require('fs');
const nthline = require('nthline');
const axios = require('axios');

exports.s3Trigger = async (key) => {
    //stepfunctions = new AWS.StepFunctions();
    
    let params = {};

    return new Promise(async (resolve, reject) => {
      console.log("*********************** Paramsbucket - Key ", key);
      console.log("*********************** Paramsbucket - Bucket ", process.env.s3Bucket);
      
      const fileName = key.split('/');

      const temporalFilePath = "/tmp/" + fileName[1];

      const s3_params = {
        Bucket: process.env.s3Bucket,
        Key: key
      };
      console.log("S3 Params", s3_params);
      
      params.bucket = process.env.s3Bucket;
      params.key = key;
      params.temporalFilePath = temporalFilePath;
      
      const currentDate = new Date();
      params.uniqueId = currentDate.toISOString().split('T')[0] + "-" + uniqid();
      params.processId = params.uniqueId;

      let file = fs.createWriteStream(temporalFilePath);
        
      s3.getS3ObjectAndcreateReadStream(process.env.s3Bucket, key, file);

      return endStreamFile(file)
        .then((fromResolve) => {
            console.log("***********************getcsvFileFromS3 - count rows");
            //get total rows
            return countAndReadFile(temporalFilePath);
        })
        .then((fromResolve) => {
            params.totalRows = fromResolve[1];
            console.log("***********************getcsvFileFromS3 - get headers");
            return readLineAndGetJson(temporalFilePath, 0, "", "");
        })
        .then(async (fromResolve) => {
            console.log("***********************getcsvFileFromS3 - done", fromResolve);
            //validate the headers index
            
            params.headersIndex = fromResolve;

            // Calculate chunks size
            const indexRange = [];
            
            let index = 1;
            while (index < params.totalRows) {
                
                const endAt = parseInt(index) + parseInt(process.env.BLOCK_SIZE);
                
                const limit = (endAt > params.totalRows) ? params.totalRows : endAt;

                console.log(endAt, limit);

                const values = {
                    startAt: index,
                    endAt: limit
                };

                // call 
                const postParams = {
                    ...params,
                    indexRange: values
                };

                const response = await axios.post(process.env.CURRENT_API + '/process-chunks', 
                    postParams
                );

                indexRange.push(values);

                index = limit + 1; 
                
            }

            params.indexRange = indexRange;
            
            console.log("params:", params);
            return "";
            // console.log("file exist", fromResolve);
            //resolve(params);
        })
        .then((fromResolve) => {
            console.log("***********************getcsvFileFromS3 - done", fromResolve);
            
            //params.headersIndex = fromResolve;
            // console.log("file exist", fromResolve);
            resolve(params);
        })
        .catch((error) => {
            console.log("file does not exist ", error);
            reject(error);
        });
    });
  }
  

function endStreamFile(file) {
return new Promise(function (resolve, reject) {
    file.on('close', function () {
        console.log('done');
        resolve();
    });
    file.on('error', reject);
});
}

const readLineAndGetJson = (filePath, rowIndex, email, crmid) => {
return new Promise((resolve, reject) => {
    nthline(rowIndex, filePath)
    .then((line) => {
        let arrayLine = [];
        // console.log(line);
        // arrayLine = line.split(',');
        line = line.replace(/,,/g, ", ,");
        arrayLine = line.match(/("[^"]+"|[^,]+)/g);

        console.log(arrayLine);
        /*
        if (rowIndex === 0) {
            let index;

            valueToFind = crmid;
            index = arrayLine.findIndex(isHeaderRow);
            // console.log(valueToFind, index);
            headersIndex[valueToFind] = index;

            valueToFind = email;
            index = arrayLine.findIndex(isHeaderRow);
            // console.log(valueToFind, index);
            headersIndex[valueToFind] = index;

            console.log(headersIndex);
        }
        */
       resolve(arrayLine);

    });
});
}

function countAndReadFile(pathFile) {
    var i;
    var count = 0;
    const chunks = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(pathFile)
        .on('data', function (chunk) {
            chunks.push(chunk);
            for (i = 0; i < chunk.length; ++i) {
            if (chunk[i] == 10) count++;
            }
        })
        .on('error', reject)
        .on('end', function () {
            console.log(count);
            // resolve(Buffer.concat(chunks).toString('utf8'));
            resolve([Buffer.concat(chunks), count - 1]);
        });
    });
}