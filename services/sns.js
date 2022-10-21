//Configure AWS
const AWS = require('aws-sdk');

let snsHandler;

// Publishing a Message to an SNS Topic
exports.publish = (params) => {
  loadKeys();

  // console.log(params);
  return new Promise((resolve, reject) => {
    var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

    // Handle promise's fulfilled/rejected states
    publishTextPromise.then(
      function(data) {
        console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
        console.log("MessageID is " + data.MessageId);
        resolve(data);
      }).catch(
        function(err) {
        console.error(err, err.stack);
        reject(err);
      });
  });
}

function loadKeys(){
    if (process.env.DMC_ENV && process.env.DMC_ENV == 'LOCAL') {
    let credentials = new AWS.SharedIniFileCredentials({
      profile: process.env.LOCAL_AWSPROFILE,
      filename: process.env.LOCAL_AWSFILENAME
    });
    AWS.config.credentials = credentials;
  }
}
