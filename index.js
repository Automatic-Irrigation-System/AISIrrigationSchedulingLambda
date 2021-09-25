"use strict";

const { Constants } = require("./constants");
let common = require("./common");
const AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-south-1",
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const irrigationSchedulingTable = "irrigation-schedule";

exports.handler = async (event) => {
  let response;
  let statusCode;

  const requestBody = event.body ? JSON.parse(event.body) : null;
  var queryString = event.queryStringParameters;

  switch (true) {
    case event.httpMethod === Constants.PostMethod &&
      event.path === Constants.ImmediateSchedulingPath:
      response = await immediateScheduling(requestBody.hardwareId);
      statusCode = 201;
      break;
    case event.httpMethod === Constants.PostMethod &&
      event.path === Constants.SchedulingPath:
      response = await simpleScheduling(
        requestBody.hardwareId,
        requestBody.scheduledTimeList
      );
      statusCode = 201;
      break;
  }
  let finalResponse = buildResponse(statusCode, response);
  return finalResponse;
};

let immediateScheduling = async function (hardwareId) {
  let scheduleTime = Date.now();
  let item = {
    hardwareId: hardwareId,
    schedulingType: Constants.ImmediateSchedulingType,
    at: [scheduleTime],
    isComplete: null,
  };
  const params = {
    TableName: irrigationSchedulingTable,
    Item: item,
  };

  return await common.putInDB(dynamodb, params);
};

let simpleScheduling = async function (hardwareId, scheduledTimeList) {
  let item = {
    hardwareId: hardwareId,
    schedulingType: Constants.SimpleSchedulingType,
    at: scheduledTimeList,
    isComplete: false,
  };
  const params = {
    TableName: irrigationSchedulingTable,
    Item: item,
  };

  return await common.putInDB(dynamodb, params);
};

let buildResponse = function (statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
};
