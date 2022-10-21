const AWS = require('aws-sdk');

var s3;// =null;

//Get an object from S3
exports.get = (bucket, key) =>{
  loadKeys();


  return new Promise((resolve, reject) =>{

      s3.getObject({

          Bucket: bucket,
          Key: key

      }, (err, data) => {

          if (err) {
              reject(err);
          }

          resolve(data);

      });

  });//Close Promise Wrapper

};

//Get a specific S3 object
exports.getS3ObjectStream = (bucket, key) => {
  // let s3 = new AWS.S3();
  loadKeys();

  let result;
  return  new Promise (async (resolve, reject)=>{
    result = await s3.getObject({
      Bucket: bucket,
      Key: key
    }).createReadStream();
    resolve( result );

    // s3.getObject({
    //   Bucket: bucket,
    //   Key: key
    // }, (error, data) =>{
    //   if(error) return reject(error);
    //   // console.log(data);
    //   if(data){
    //     // result = JSON.parse( data.Body.toString('utf-8') );
    //     result = data;
    //   }
    //   else {
    //     result = 'none';
    //   }
    //   resolve( result );
    // });
  });
}

//Create an object on S3
exports.create = (params) =>{
  loadKeys();

  // let s3 = new AWS.S3();

  return new Promise((resolve, reject) =>{

    s3.putObject(params, (err, data)=>{

      if (err) {
          console.log(err);
         reject(err);
      }

      resolve(data);

    });

  });//Close Promise Wrapper

};

//Upload an object on S3
exports.upload = (params) =>{
  loadKeys();

  // let s3 = new AWS.S3();

  return new Promise((resolve, reject) =>{
    s3.upload(params, (err, data)=>{

      if (err) {
          console.log(err);
         reject(err);
      }
      
      resolve(data);

    });

  });//Close Promise Wrapper

};

//Get a specific S3 object
exports.getS3Object = (bucket, key) => {
  loadKeys();
  // let s3 = new AWS.S3();
  let result;
  return  new Promise ((resolve, reject)=>{
    s3.getObject({
      Bucket: bucket,
      Key: key
    }, (error, data) =>{
      if(error) return reject(error);
      // console.log(data);
      if(data){
        // result = JSON.parse( data.Body.toString('utf-8') );
        result = data;
      }
      else {
        result = 'none';
      }
      resolve( result );
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


  s3 = new AWS.S3();
}