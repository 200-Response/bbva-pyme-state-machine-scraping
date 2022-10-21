const options = { style: 'currency', currency: 'USD' };
const numberFormat = new Intl.NumberFormat('en-US', options);

const formatDate = (diffDias, dateToStart) => {
    var d;
    if (dateToStart !== '') {
      d = new Date(dateToStart);
    }
    else{
      d = new Date();
    }
    d.setDate(d.getDate() - diffDias);
  
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let year = d.getFullYear();
  
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
  
    let dateArr = [];
    dateArr.push( [year, month, day].join('-') );
    dateArr.push(year);
    dateArr.push(month);
    dateArr.push(day);
  
    return dateArr; //[year, month, day].join('-');
};

const calculateDateRange = (params) => {
    var elementDate = [];
    let dateToStart = '';
    
    if(params?.date !== '' ){
        dateToStart = params?.date;
    }
    
    var fromDate = formatDate(params?.diffDias, dateToStart); //new Date("2020-9-10");
    var fromDate1 = formatDate(params?.diffDias, dateToStart); //new Date("2020-9-10");
    
    elementDate.push(fromDate);
    elementDate.push(fromDate1);

    console.log("calculateDateRange():", params?.diffDias + ' days ago was: ' + elementDate[0]);
    console.log('calculateDateRange(): Today is: ' + elementDate[1]);

    return elementDate;
};

const getQuery = (elementDate, client, table) => {

    let query = "SELECT DISTINCT(transaction_id), transaction_amount, ga_id, type FROM "+client+"."+table+" WHERE ";

    // same year?
    if(elementDate[1][1] == elementDate[0][1]){
      console.log("getQuery():Same year");
      // same month?
      if(elementDate[1][2] == elementDate[0][2]){
        console.log("getQuery():Same month");
        query = query + "partition_0='"+elementDate[0][1]+"' AND partition_1='"+elementDate[0][2]+"' AND unixdate BETWEEN '"+elementDate[1][0]+"' AND '"+elementDate[0][0]+"'";
      } else{
        console.log("getQuery():Different month");
        query = query + "partition_0='"+elementDate[0][1]+"' AND (partition_1='"+elementDate[0][2]+"' OR partition_1='"+elementDate[1][2]+"') AND unixdate BETWEEN '"+elementDate[1][0]+"' AND '"+elementDate[0][0]+"'";
      }
    }else{
      console.log("getQuery():Different year");
      // same month?
      if(elementDate[1][2] == elementDate[0][2]){
        console.log("getQuery():Same month");
        query = query + "(partition_0='"+elementDate[0][1]+"' OR partition_0='"+elementDate[1][1]+"') AND partition_1='"+elementDate[0][2]+"' AND unixdate BETWEEN '"+elementDate[1][0]+"' AND '"+elementDate[0][0]+"'";
      }else{
        console.log("getQuery():Different month");
        query = query + "(partition_0='"+elementDate[0][1]+"' OR partition_0='"+elementDate[1][1]+"') AND (partition_1='"+elementDate[0][2]+"' OR partition_1='"+elementDate[1][2]+"') AND unixdate BETWEEN '"+elementDate[1][0]+"' AND '"+elementDate[0][0]+"'";
      }
    }

    // query = query + " limit 10000;"
    query = query + ";"

    console.log("getQuery():query", query);
    return query;
}

const getClientConfig = (disgaConfig) => {
  const currentClient = disgaConfig.shift();
  const pendingClients = disgaConfig;
  const count = disgaConfig?.length || 0;
  console.log("getClientConfig():currentClient:pendingClients:count", currentClient, pendingClients, count);
  
  return { currentClient, pendingClients, count };
};

const delay = (time) => {
  return new Promise(resolve => setTimeout(resolve, time));
};

const sendSNS = async ( snsService, { client, dateToProcess, disData, gaData, disDataGA, disDataNonGA } ) => {
  const snsMessage =
  "Client: " + client.toUpperCase()
  + `\nunixdate: ${dateToProcess[0][0]}`
  + `\n`
  + `\nDIS Revenue: ${numberFormat.format(disData?.totalDISRevenue)}`
  + `\nDIS Transactions: ${disData?.totalDISRecordsWithRevenue}`
  + `\n`
  + `\nGA Revenue: ${numberFormat.format(gaData?.totalGARevenue)}`
  + `\nGA Transactions: ${gaData?.totalGARecords}`
  + `\n`
  + `\nDIS Revenue with ga_id: ${numberFormat.format(disDataGA?.totalDISRevenue)}`
  + `\nDIS Transactions with ga_id: ${disDataGA?.totalDISRecordsWithRevenue}`
  + `\n`
  + `\nDIS Revenue without ga_id: ${numberFormat.format(disDataNonGA?.totalDISRevenue)}`
  + `\nDIS Transactions without ga_id: ${disDataNonGA?.totalDISRecordsWithRevenue}`

  const params = {
      Message: snsMessage,
      Subject: 'DIS-GA-Reporting: ' + client.toUpperCase(),
      TopicArn: process.env.SNS_REPORT_ARN
  };

  await snsService.publish(params);
  
};

const sendSNSThreshold = async ( snsService, { client, dateToProcess, disData, gaData, disDataGA, disDataNonGA }, threshold ) => {
  const snsMessage =
  "Error Client: " + client.toUpperCase()
  + `\nunixdate: ${dateToProcess[0][0]}` 
  + `\n`
  + `\nDIS Revenue: ${numberFormat.format(disData?.totalDISRevenue)}`
  + `\nDIS Transactions: ${disData?.totalDISRecordsWithRevenue}`
  + `\n`
  + `\nGA Revenue: ${numberFormat.format(gaData?.totalGARevenue)}`
  + `\nGA Transactions: ${gaData?.totalGARecords}`
  + `\n`
  + `\nDIS Revenue with ga_id: ${numberFormat.format(disDataGA?.totalDISRevenue)}`
  + `\nDIS Transactions with ga_id: ${disDataGA?.totalDISRecordsWithRevenue}`
  + `\n`
  + `\nDIS Revenue without ga_id: ${numberFormat.format(disDataNonGA?.totalDISRevenue)}`
  + `\nDIS Transactions without ga_id: ${disDataNonGA?.totalDISRecordsWithRevenue}`
  + `\n`
  + `\nDIS-GA Threshold <: ${threshold}%`

  const params = {
      Message: snsMessage,
      Subject: 'DIS-GA-Error-Threshold-Reporting: ' + client.toUpperCase(),
      TopicArn: process.env.SNS_ERROR_DIS_ARN
  };

  await snsService.publish(params);
  
};

module.exports = {
    formatDate,
    calculateDateRange,
    getQuery,
    getClientConfig,
    delay,
    sendSNS,
    sendSNSThreshold
};