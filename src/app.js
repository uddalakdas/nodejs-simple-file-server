var express = require('express'),
    bodyParser = require('body-parser');

var resources = require('./resources/resources.json');
var jobManager = require('./job-manager.js');

var app = exports.app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.use(allowCrossDomain);

jobManager.init();

app.get('/', function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send(resources.instruction.join('\n'));
});

app.get('/job', function (req, res) {
    res.json(jobManager.getActiveJobs());
});

app.post('/job', function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send(201, jobManager.createJob().toString());
});

app.get('/job/:jobId/state', function (req, res) {
    var job = jobManager.getJobDetail(req.params.jobId);
    res.set('Content-Type', 'text/plain');
    if (job != null) {
        res.send(200, job.state);
    } else {
        res.send(404, 'Job-id either invalid or expired.');
    }
});

app.post('/job/:jobId/state/uploaded', function (req, res) {
    var bSuccess = jobManager.changeJobState(req.params.jobId, 'uploaded');
    res.set('Content-Type', 'text/plain');
    if (bSuccess) {
        res.send(201, 'State changed to uploaded.');
    } else {
        res.send(403, 'Invalid transition');
    }
});

app.post('/job/:jobId/state/copied', function (req, res) {
    var jobId = req.params.jobId;
    var bSuccess = jobManager.changeJobState(jobId, 'copied');
    res.set('Content-Type', 'text/plain');
    if (bSuccess) {
        jobManager.deleteJob(jobId);
        res.send(201, 'State changed to copied.');
    } else {
        res.send(403, 'Invalid transition');
    }
});

app.get('/job/:jobId/upload', function (req, res) {
    var job = jobManager.getJobDetail(req.params.jobId);
    if (job != null) {
        res.json(job.files);
    } else {
        res.set('Content-Type', 'text/plain');
        res.send(404, 'Job-id either invalid or expired.');
    }
});

app.post('/job/:jobId/upload', function (req, res) {
    res.set('Content-Type', 'text/plain');

    var job = jobManager.getJobDetail(req.params.jobId);
    if (job != null && 'ready,uploading'.indexOf(job.state) > -1) {
        if (req.body.fileName && req.body.fileContent) {
            jobManager.saveFile(req.params.jobId, req.body.fileName, req.body.fileContent, function (err) {
                if (err) {
                    res.send(500, err);
                } else {
                    jobManager.changeJobState(req.params.jobId, 'uploading');
                    res.send(201);
                }
            });
        } else {
            res.send(400);
        }
    } else {
        res.send(403, 'Invalid job-id or job-state.');
    }
});

app.get('/job/:jobId/file/:fileName', function (req, res) {
    var jobId = req.params.jobId,
        fileName = req.params.fileName;

    var filePath = jobManager.getFilePath(jobId, fileName);
    res.sendfile(filePath, function (err) {
        if (err) {
            res.send(404, 'File not found.');
        }
    });
});

var server = app.listen(8000, function () {
    console.log('Listening on port %d', server.address().port);
});