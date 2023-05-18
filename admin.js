const {
    updateUserStatus
  } = require("../services/admin");
  
  const { controller } = require("../middleware/controller");
  
  module.exports = {
    updateUserStatus: controller(updateUserStatus),
  };
  