"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

// Code based on Stack Overflow code; source is below
// https://stackoverflow.com/questions/32707322/how-to-make-a-handlebars-helper-global-in-expressjs/42224612#42224612
var register = function register(Handlebars) {
  var helpers = {
    percentage: function percentage(numerator, denominator) {
      return Math.round(Number(numerator) / Number(denominator) * 1000) / 10;
    }
  };

  if (Handlebars && typeof Handlebars.registerHelper === "function") {
    for (var prop in helpers) {
      Handlebars.registerHelper(prop, helpers[prop]);
    }
  } else {
    return helpers;
  }
};

var helpers = register(null);
var _default = helpers;
exports["default"] = _default;