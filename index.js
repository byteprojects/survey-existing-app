const Admin = require("./Admin.json");
const createSurveySchema = require("./SurveySchema.json");
const createAnswerSchema = require("./answerSchema.json");
const createRequestSchema = require("./requestSchems.json");
const handleRequestSchema = require("./handleRequestSchema.json");
const assignSurveySchema = require("./assignSurvey.json");

module.exports = {
  adminSchema: Admin,
  surveySchema:createSurveySchema,
  answerSchema:createAnswerSchema,
  requestSchema:createRequestSchema,
  handleRequestSchema:handleRequestSchema,
  assignSurveySchema: assignSurveySchema
};
