const {
  indivReg,
  confirmCode,
  orgReg,
  adminReg,
  login,
  resendCode,
  resetPassword,
  changePassword,
  forgetPassword
} = require("../services/auth");

const { controller } = require("../middleware/controller");

module.exports = {
  indivReg: controller(indivReg),
  confirmCode: controller(confirmCode),
  orgReg: controller(orgReg),
  adminReg: controller(adminReg),
  login: controller(login),
  resendCode: controller(resendCode),
  resetPassword: controller(resetPassword),
  changePassword: controller(changePassword),
  forgetPassword: controller(forgetPassword),
};
