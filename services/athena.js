const AthenaExpress = require("athena-express"),
AWS = require("aws-sdk");
let AthenaHandler;
// let	awsCredentials;
//configuring athena-express with aws sdk object
let athenaExpressConfig;
//Initializing athena-express
let athenaExpress;

exports.runQuerys = (params, db) =>{
	// await secrets.getSecrets(secretNames);
	loadKeys();
	let records = [];
	let query = {
		sql: params /* required */,
		db: db, /* optional. You could specify a database here or in the advance configuration option mentioned above*/
		// getStats: true,
		skipResults: true
  };
  // console.log("athena query");
	return new Promise ((resolve, reject) => {
	  athenaExpress.query(query)
	    .then(results => {
				console.log("---------------------- results ------------------");
				// console.log(results);
				// records = results.Items;
				resolve(results);
	    })
	    .catch(error => {
	      console.log(error);
				reject(error);
	  });
	});
}

exports.runQuerysGetStoredResults = (params, db) =>{
	loadKeys();
	let records = [];
	let query = {
		sql: params /* required */,
		db: db, /* optional. You could specify a database here or in the advance configuration option mentioned above*/
		// getStats: true,
		skipResults: false
  };
  // console.log("athena query");
	return new Promise ((resolve, reject) => {
	  athenaExpress.query(query)
	    .then(results => {
				console.log("---------------------- results ------------------");
				console.log(results?.Items?.length);
				// records = results.Items;
				resolve(results);
	    })
	    .catch(error => {
	      console.log(error);
				reject(error);
	  });
	});
}

exports.startQuery = (params, db) =>{
	loadKeys();

	var paramsAthena = {
		QueryString: params, /* required */
		ResultConfiguration: {
			OutputLocation: "s3://"+process.env.athenaOutputQuerys
		}
	};

	let query = {
		sql: params /* required */,
		db: db, /* optional. You could specify a database here or in the advance configuration option mentioned above*/
		// getStats: true,
		skipResults: true
  	};
  	return new Promise ((resolve, reject) => {
		AthenaHandler.startQueryExecution(paramsAthena, function(err, data) {
			if (err) reject(err); // an error occurred
			else     resolve(data);           // successful response
		  });
		  
	});
}

exports.startQueryExecution = (paramsAthena) =>{
	loadKeys();

	return new Promise ((resolve, reject) => {
		AthenaHandler.startQueryExecution(paramsAthena, function(err, data) {
			if (err) reject(err); // an error occurred
			else     resolve(data);           // successful response
		  });
		  
	});
}

exports.getQueryExecution = (params) => {
	loadKeys();

	return new Promise((resolve, reject) => {
		AthenaHandler.getQueryExecution(params, function (err, data) {
		if (err) reject(err);
		else resolve(data);
	  });
  
	});
}  

exports.getQueryResults = (params) => {
	loadKeys();
	
	return new Promise((resolve, reject) => {
		AthenaHandler.getQueryResults(params, function (err, data) {
		if (err) reject(err);
		else resolve(data);
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
	// AWS.config.update(awsCredentials);
	//configuring athena-express with aws sdk object
	athenaExpressConfig = {
		aws: AWS, /* required */
		s3: "s3://temp.crm.upload/clients/data-lake/dis-ga/results/",
		skipResults: false
	};
	//Initializing athena-express
	athenaExpress = new AthenaExpress(athenaExpressConfig);

	AthenaHandler = new AWS.Athena();
  }
