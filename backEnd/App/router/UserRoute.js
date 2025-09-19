const express = require("express");
const validateUserInput = require("../middlewares/validateUserInput");
const {
  registerUser,
  verification,
  login,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controller/UserController");
const isAuthenticated = require("../middlewares/isAuthenticated");

const UserRouter = express.Router();

UserRouter.post("/register", validateUserInput, registerUser);
UserRouter.post("/verify", verification);
UserRouter.get("/verify", verification);
UserRouter.post("/login", login);
UserRouter.post("/logout", isAuthenticated, logout);
UserRouter.post("/forgot-password", forgotPassword);
UserRouter.post("/reset-password", resetPassword);

module.exports = UserRouter;
