
//Configure AWS
const AWS = require('aws-sdk');

// Create an SQS service object
var sqs; // = new AWS.SQS({apiVersion: '2012-11-05'});

exports.sendQueueMessage = (params)=>{
loadKeys();
  return new Promise((resolve, reject) => {

      sqs.sendMessage(params, (err, data)=>{

        if (err) {
          reject(err);

        } else {

          resolve(data);

        }

      });

  });

}


function loadKeys(){
  AWS.config = new AWS.Config();

  if (process.env.DMC_ENV && process.env.DMC_ENV == 'LOCAL') {
    console.log(' **************** ENV LOCAL - loading aws profile **************');
    let credentials = new AWS.SharedIniFileCredentials({
      profile: process.env.LOCAL_AWSPROFILE,
      filename: process.env.LOCAL_AWSFILENAME
    });
    AWS.config.credentials = credentials;
  }
  AWS.config.update({
    region: 'us-east-1'
  });
  sqs = new AWS.SQS({apiVersion: '2012-11-05'});
}
