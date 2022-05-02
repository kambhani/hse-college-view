import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import { create } from 'express-handlebars';
import compression from 'compression';
import helpers from './handlebars_helpers.js';

const app = express();

// Mongoose configuration
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost/hse-college-view-dev", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.log("Failure");
    console.log(err);
  });

import College from './models/College.js';


// Compression middleware
app.use(compression());

// Handlebars middleware
const hbs = create({
  helpers: helpers
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

// Body Parser Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.render('home', {
    title: 'Home'
  });
});

// Page for selecting college to view data
app.get('/view', (req, res) => {
  College.find({}, 'name pictureId')
    .lean()
    .then((data) => {
      res.render('view', {
        title: 'View college data',
        collegeData: data
      });
    });
});

// Page for viewing data on a single college
app.get('/view/:college', (req, res) => {
  (async function() {
    const college = await College.findById(req.params.college).lean();
    if (college) {
      res.render('college', {
        title: `${college.name} | Admissions Data`,
        data: college
      })
    } else {
      res.render('college', {
        title: 'College not found',
        error: true
      });
    }
  }) ();
});

// Page for entering in college to add or update
app.get('/update', (req, res) => {
  res.render('update', {
    title: 'Add or update a college'
  })
});

// Page to inform user of status of add/update request
app.post('/update', (req, res) => {
  fetch(`https://blue-ridge-api.naviance.com/application-statistics/uuid/${req.body.uuid}`, {
    method: 'GET',
    headers: {
      authorization: req.body.jwt
    }
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.message) {
        res.render('update', {
          title: 'Add or update a college',
          message: json.message
        })
      } else if (json.scattergrams.gpa.gpaCount === 0) {
        res.render('update', {
          title: 'Add or update a college',
          message: {
            error: 'The requested college either does not exist or has no admissions data',
            code: '404'
          }
        });
      } else {
        (async function () {
          const college = await College.findById(req.body.uuid);
          let successMessage;
          if (college) {
            let applicationsToAdd = [];
            let yearsStored = [];
            for (let i = 0; i < college.applicationsByYear.length; i++) {
              yearsStored.push(college.applicationsByYear[i].year);
            }
            for (const year of Object.keys(json.applicationsByYear)) {
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
              const word = (applicationsToAdd.length === 1) ? 'entry' : 'entries';
              successMessage = `${college.name} has been updated with ${applicationsToAdd.length} new ${word}.`;
              college.applicationsByYear.push(applicationsToAdd);
              college.save();
            } else {
              successMessage = `${college.name} is already up to date.`
            }
          } else {
            const nameResp = await fetch(`https://blue-ridge-api.naviance.com/college/uuid/${req.body.uuid}`, {
              method: 'GET',
              headers: {
                authorization: req.body.jwt
              }
            });
            const nameJson = await nameResp.json();
            let applications = [];
            for (const [key, value] of Object.entries(json.applicationsByYear)) {
              applications.push({
                year: Number(key),
                totalApplied: Number(value.totalApplied),
                totalAccepted: Number(value.totalAccepted),
                totalEnrolled: Number(value.totalEnrolled)
              })
            }
            await new College({
              _id: req.body.uuid,
              name: nameJson.name,
              pictureId: nameJson.hobsonsId,
              applicationsByYear: applications
            }).save();
            successMessage = `${nameJson.name} has been added to the college database.`;
          }
          res.render('update', {
            title: 'Add or update a college',
            successMessage: successMessage
          })
        }) ();
      }
    });
});

// Page for selecting multiple colleges to compare
app.get('/compare', (req, res) => {
  College.find({}, 'name _id')
    .lean()
    .then((data) => {
      res.render('compare', {
        title: 'Select colleges to compare',
        collegeData: data
      });
    });
});

// Page for viewing college data comparison
app.post('/compare', (req, res) => {
  const n = Object.keys(req.body).length;
  if (n === 0) {
    res.render('comparison', {
      title: 'Error | No colleges selected',
      error: true
    });
  }
  let data = [];
  for (let i = 0; i < n; i++) {
    (async function() {
      const college = await College.findById(Object.keys(req.body)[i]).lean();
      if (college) {
        data.push(college);
        if (data.length == n) {
          res.render('comparison', {
            title: 'College Comparison',
            data: data
          })
        }
      } else {
        res.render('comparison', {
          title: 'Error | College not found',
          error: true
        });
      }
    }) ();
  }
});

app.get('/blog', (req, res) => {
  res.render('blog', {
    title: 'The Blogs'
  });
});

app.get('/blog/purdue', (req, res) => {
  College.findById('175644bb-2e13-4906-b9c2-d12b73326a22')
    .lean()
    .then((data) => {
      res.render('purdueBlog', {
        data: data,
        title: 'Purdue Admissions Data Comparison | The Blogs'
      });
    });
});

// Selecting which port to start server on
const port = process.env.PORT || 5000;

// Starting the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});