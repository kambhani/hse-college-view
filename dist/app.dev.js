"use strict";

var _express = _interopRequireDefault(require("express"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _mongoose = _interopRequireDefault(require("mongoose"));

var _expressHandlebars = require("express-handlebars");

var _compression = _interopRequireDefault(require("compression"));

var _handlebars_helpers = _interopRequireDefault(require("./handlebars_helpers.js"));

var _College = _interopRequireDefault(require("./models/College.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var app = (0, _express["default"])(); // Mongoose configuration

_mongoose["default"].Promise = global.Promise;

_mongoose["default"].connect("mongodb://localhost/hse-college-view-dev", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("Connected");
})["catch"](function (err) {
  console.log("Failure");
  console.log(err);
});

// Compression middleware
app.use((0, _compression["default"])()); // Handlebars middleware

var hbs = (0, _expressHandlebars.create)({
  helpers: _handlebars_helpers["default"]
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views'); // Body Parser Middleware

app.use(_express["default"].urlencoded({
  extended: false
}));
app.use(_express["default"].json()); // Home page

app.get('/', function (req, res) {
  res.render('home', {
    title: 'Home'
  });
}); // Page for selecting college to view data

app.get('/view', function (req, res) {
  _College["default"].find({}, 'name pictureId').lean().then(function (data) {
    res.render('view', {
      title: 'View college data',
      collegeData: data
    });
  });
}); // Page for viewing data on a single college

app.get('/view/:college', function (req, res) {
  (function _callee() {
    var college;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(_College["default"].findById(req.params.college).lean());

          case 2:
            college = _context.sent;

            if (college) {
              res.render('college', {
                title: "".concat(college.name, " | Admissions Data"),
                data: college
              });
            } else {
              res.render('college', {
                title: 'College not found',
                error: true
              });
            }

          case 4:
          case "end":
            return _context.stop();
        }
      }
    });
  })();
}); // Page for entering in college to add or update

app.get('/update', function (req, res) {
  res.render('update', {
    title: 'Add or update a college'
  });
}); // Page to inform user of status of add/update request

app.post('/update', function (req, res) {
  (0, _nodeFetch["default"])("https://blue-ridge-api.naviance.com/application-statistics/uuid/".concat(req.body.uuid), {
    method: 'GET',
    headers: {
      authorization: req.body.jwt
    }
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.message) {
      res.render('update', {
        title: 'Add or update a college',
        message: json.message
      });
    } else if (json.scattergrams.gpa.gpaCount === 0) {
      res.render('update', {
        title: 'Add or update a college',
        message: {
          error: 'The requested college either does not exist or has no admissions data',
          code: '404'
        }
      });
    } else {
      (function _callee2() {
        var college, successMessage, applicationsToAdd, yearsStored, i, _i, _Object$keys, year, word, nameResp, nameJson, applications, _i2, _Object$entries, _Object$entries$_i, key, value;

        return regeneratorRuntime.async(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return regeneratorRuntime.awrap(_College["default"].findById(req.body.uuid));

              case 2:
                college = _context2.sent;

                if (!college) {
                  _context2.next = 11;
                  break;
                }

                applicationsToAdd = [];
                yearsStored = [];

                for (i = 0; i < college.applicationsByYear.length; i++) {
                  yearsStored.push(college.applicationsByYear[i].year);
                }

                for (_i = 0, _Object$keys = Object.keys(json.applicationsByYear); _i < _Object$keys.length; _i++) {
                  year = _Object$keys[_i];

                  if (!yearsStored.includes(Number(year))) {
                    applicationsToAdd.push({
                      year: Number(year),
                      totalApplied: Number(json.applicationsByYear[year].totalApplied),
                      totalAccepted: Number(json.applicationsByYear[year].totalAccepted),
                      totalEnrolled: Number(json.applicationsByYear[year].totalEnrolled)
                    });
                  }
                }

                if (applicationsToAdd.length > 0) {
                  word = applicationsToAdd.length === 1 ? 'entry' : 'entries';
                  successMessage = "".concat(college.name, " has been updated with ").concat(applicationsToAdd.length, " new ").concat(word, ".");
                  college.applicationsByYear.push(applicationsToAdd);
                  college.save();
                } else {
                  successMessage = "".concat(college.name, " is already up to date.");
                }

                _context2.next = 22;
                break;

              case 11:
                _context2.next = 13;
                return regeneratorRuntime.awrap((0, _nodeFetch["default"])("https://blue-ridge-api.naviance.com/college/uuid/".concat(req.body.uuid), {
                  method: 'GET',
                  headers: {
                    authorization: req.body.jwt
                  }
                }));

              case 13:
                nameResp = _context2.sent;
                _context2.next = 16;
                return regeneratorRuntime.awrap(nameResp.json());

              case 16:
                nameJson = _context2.sent;
                applications = [];

                for (_i2 = 0, _Object$entries = Object.entries(json.applicationsByYear); _i2 < _Object$entries.length; _i2++) {
                  _Object$entries$_i = _slicedToArray(_Object$entries[_i2], 2), key = _Object$entries$_i[0], value = _Object$entries$_i[1];
                  applications.push({
                    year: Number(key),
                    totalApplied: Number(value.totalApplied),
                    totalAccepted: Number(value.totalAccepted),
                    totalEnrolled: Number(value.totalEnrolled)
                  });
                }

                _context2.next = 21;
                return regeneratorRuntime.awrap(new _College["default"]({
                  _id: req.body.uuid,
                  name: nameJson.name,
                  pictureId: nameJson.hobsonsId,
                  applicationsByYear: applications
                }).save());

              case 21:
                successMessage = "".concat(nameJson.name, " has been added to the college database.");

              case 22:
                res.render('update', {
                  title: 'Add or update a college',
                  successMessage: successMessage
                });

              case 23:
              case "end":
                return _context2.stop();
            }
          }
        });
      })();
    }
  });
}); // Page for selecting multiple colleges to compare

app.get('/compare', function (req, res) {
  _College["default"].find({}, 'name _id').lean().then(function (data) {
    res.render('compare', {
      title: 'Select colleges to compare',
      collegeData: data
    });
  });
}); // Page for viewing college data comparison

app.post('/compare', function (req, res) {
  var n = Object.keys(req.body).length;

  if (n === 0) {
    res.render('comparison', {
      title: 'Error | No colleges selected',
      error: true
    });
  }

  var data = [];

  var _loop = function _loop(i) {
    (function _callee3() {
      var college;
      return regeneratorRuntime.async(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return regeneratorRuntime.awrap(_College["default"].findById(Object.keys(req.body)[i]).lean());

            case 2:
              college = _context3.sent;

              if (college) {
                data.push(college);

                if (data.length == n) {
                  res.render('comparison', {
                    title: 'College Comparison',
                    data: data
                  });
                }
              } else {
                res.render('comparison', {
                  title: 'Error | College not found',
                  error: true
                });
              }

            case 4:
            case "end":
              return _context3.stop();
          }
        }
      });
    })();
  };

  for (var i = 0; i < n; i++) {
    _loop(i);
  }
});
app.get('/blog', function (req, res) {
  res.render('blog', {
    title: 'The Blogs'
  });
});
app.get('/blog/purdue', function (req, res) {
  _College["default"].findById('175644bb-2e13-4906-b9c2-d12b73326a22').lean().then(function (data) {
    res.render('purdueBlog', {
      data: data,
      title: 'Purdue Admissions Data Comparison | The Blogs'
    });
  });
}); // Selecting which port to start server on

var port = process.env.PORT || 5000; // Starting the server

app.listen(port, function () {
  console.log("Server started on port ".concat(port));
});