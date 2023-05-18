const {
    create,
    answer,
    getSurveys,
    getOwnedSurveys,
    getSurveyResult,
    updateSurveyPoints,
    assignSurvey,
    getOwnedResults,
    getById,
    update
  } = require("../services/survey");
  
  const { controller } = require("../middleware/controller");
  
  module.exports = {
    create: controller(create),
    answer: controller(answer),
    getSurveys: controller(getSurveys),
    getOwnedSurveys: controller(getOwnedSurveys),
    getSurveyResult: controller(getSurveyResult),
    updateSurveyPoints: controller(updateSurveyPoints),
    assignSurvey: controller(assignSurvey),
    getOwnedResults: controller(getOwnedResults),
    getById: controller(getById),
    update: controller(update),
  };
  