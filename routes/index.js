var express = require('express');
var router = express.Router();
var pgp = require('pg-promise')();
var db = pgp('postgres://postgres:postgres@localhost:5432/comt');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'The U.S. Integrated Ocean Observing System (IOOS)' });
});

/* GET region map page. */
router.get('/regions', function(req, res, next) {
  res.render('regions', { title: 'The U.S. Integrated Ocean Observing System (IOOS) | Regions Map' });
});

/* GET contact us page. */
router.get('/contact-us', function(req, res, next) {
  res.render('contact-us', { title: 'The U.S. Integrated Ocean Observing System (IOOS) | Contact Us' });
});

/* GET comt about page. */
router.get('/comt', function(req, res, next) {
  db.many('SELECT title, SUBSTRING (overview, 0, 280) as overview FROM projects ORDER BY id ASC', [true])
  .then(function (data) {
    res.render('comt/index', {
      title: 'The U.S. Integrated Ocean Observing System (IOOS) | Coastal and Ocean Modeling Testbed Projects',
      projects: data });
  })
  .catch(function (error) {
    console.log('ERROR:', error);
  });
});

/* GET comt projects page. */
router.get('/comt/projects/:project', function(req, res, next) {
  var projectTitle = req.params.project.replace(/-/g, '');
  var datasets = {};
  if (projectTitle === 'chesapeakebayhypoxia')
    datasets = require('../public/comt_datasets');
  db.task(function(t){
    return t.batch([
      t.many('SELECT title FROM projects ORDER BY id ASC', [true]),
      t.one('SELECT id, title, team as "Project Team", overview as "Project Overview and Results", ' +
              'model_desc as "Model Descriptions", sub_project_desc as "Sub-Project Descriptions", ' +
              'pubs as "Publications" FROM projects WHERE regexp_replace(LOWER(title), \'[\.\/\\s+]\', \'\', \'g\') = \'' + projectTitle + '\'', [true])
    ]);
  })
  .then(function (data) {
    res.render('comt/project', {
      title: 'The U.S. Integrated Ocean Observing System (IOOS) | Coastal and Ocean Modeling Testbed Projects | ' + data[1].title,
      data: data,
      projectTitle: projectTitle,
      datasets: datasets,
      path: req.path
    });
  })
  .catch(function (error) {
    console.log('ERROR:', error);
  });
});

/* GET comt dataset page. */
router.get('/comt/projects/:project/:dataset', function(req, res, next) {
  var datasetTitle = req.params.dataset,
      datasets = require('../public/comt_datasets'),
      dataset = {},
      projectTitle = req.params.project.replace(/-/g, '');
  datasets.dataset.every(function (e, i) {
    if (e.title.replace(/[^\w]/g, '-').toLowerCase() === datasetTitle) {
      dataset = e;
      return false;
    }
    else
      return true;
  });
  db.one('SELECT title FROM projects WHERE regexp_replace(LOWER(title), \'[\.\/\\s+]\', \'\', \'g\') = \'' + projectTitle + '\'', [true])
    .then(function (project) {
      res.render('comt/dataset', {
        title: 'The U.S. Integrated Ocean Observing System (IOOS) | Coastal and Ocean Modeling Testbed Projects | ' + project.title + ' | Datasets',
        dataset: dataset,
        project: project,
        projectPath: req.params.project
      });
    })
    .catch(function (error) {
      console.log('ERROR:', error);
  });
});

module.exports = router;
