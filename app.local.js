const AWS = require('aws-sdk');
const homedir = require('os').homedir();

const app = require('./app')
const port = 3088

//set env variable to identify local running
process.env.LOCAL_AWSPROFILE = 'bbva2022';
process.env.LOCAL_AWSFILENAME = homedir+'/.aws/credentials';

process.env.DIS_GA_TABLE = 'dis-ga-reporting';

var credentials = new AWS.SharedIniFileCredentials({
	profile: process.env.LOCAL_AWSPROFILE,
	filename: process.env.LOCAL_AWSFILENAME
});
AWS.config.credentials = credentials;
AWS.config.update({
	region: 'us-east-1'
});

app.listen(port);
console.log(`listening on http://localhost:${port}`);
