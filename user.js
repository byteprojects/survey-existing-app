const {
    getPersonalInfo,
    sendCodeEditEmail,
    editEmail,
    getAll
  } = require("../services/user");
  
  const { controller } = require("../middleware/controller");
  
  module.exports = {
    getPersonalInfo: controller(getPersonalInfo),
    sendCodeEditEmail: controller(sendCodeEditEmail),
    editEmail: controller(editEmail),
    getAll: controller(getAll),
  };