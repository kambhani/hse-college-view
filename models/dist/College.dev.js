"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Schema = _mongoose["default"].Schema;
var College = new Schema({
  _id: String,
  name: String,
  pictureId: Number,
  applicationsByYear: [{
    year: Number,
    totalApplied: Number,
    totalAccepted: Number,
    totalEnrolled: Number
  }]
});

var _default = _mongoose["default"].model("College", College);

exports["default"] = _default;