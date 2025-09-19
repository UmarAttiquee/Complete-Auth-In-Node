const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" },
});

const SessionSchemaModel = mongoose.model(
  "Session_User_Collection",
  SessionSchema
);

module.exports = SessionSchemaModel;
