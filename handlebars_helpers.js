// Code based on Stack Overflow code; source is below
// https://stackoverflow.com/questions/32707322/how-to-make-a-handlebars-helper-global-in-expressjs/42224612#42224612

var register = function(Handlebars) {
  var helpers = {
    percentage(numerator, denominator) {
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
export default helpers;