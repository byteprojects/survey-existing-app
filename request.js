const {
    create,
    approveRequest,
    rejectRequest,
    getOutgoingRequests,
    getIncomingRequests,
    getPendingIncomingRequests
  } = require("../services/request");
  
  const { controller } = require("../middleware/controller");
  
  module.exports = {
    create: controller(create),
    approveRequest: controller(approveRequest),
    rejectRequest: controller(rejectRequest),
    getOutgoingRequests: controller(getOutgoingRequests),
    getIncomingRequests: controller(getIncomingRequests),
    getPendingIncomingRequests: controller(getPendingIncomingRequests),
  };
  