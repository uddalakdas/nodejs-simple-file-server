var fs = require('fs');
var util = require('util');
var path = require('path');
var rmdir = require('rimraf');

var uploadDir = './upload';
var activeJobs = [];
var cleanInterval = 60;  // in minutes

var Job = function (id) {
    this.id = id;
    this.createdOn = new Date();
    this.state = 'ready';
    this.files = [];
}

// ====================== util method =====================
String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
// ==================== util method end ===================

var createDir = function (dirName) {
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, 0766, function (err) {
            if (err) { console.log(err); }
        });
    }
};

var scanActiveJobs = function () {
    files = fs.readdirSync(uploadDir)
    for (var i in files) {
        stat = fs.statSync(path.join(uploadDir, files[i]));
        if (stat.isDirectory() && files[i].match(/^\d+$/)) {
            activeJobs.push(new Job(files[i]));
        }
    }
    activeJobs.sort(function (a, b) { return a.id - b.id });
};

var getJobIndex = function (id) {
    for (var i in activeJobs) {
        if (activeJobs[i].id == id) {
            return i;
        }
    }
    return -1;
};

var scanUploadedFiles = function (jobId) {
    var index = getJobIndex(jobId);
    if (index>-1) {
        fs.readdir(path.join(uploadDir, jobId), function (err, uFiles) {
            if (err) {
                console.log(err);
                return null;
            } else {
                for (var i in uFiles) {
                    if (uFiles[i].endsWith('.xml')) {
                        activeJobs[index].files.push(uFiles[i]);
                        activeJobs[index].state = 'uploading';
                    }
                }
            }
        })
    }
};

var validTransition = function (fromState, toState) {
    var bValid = false;
    switch (fromState) {
        case 'ready':
            if (toState === 'uploading')
                bValid = true;
            break;
        case 'uploading':
            if (toState === 'uploaded')
                bValid = true;
            break;
        case 'uploaded':
            if (toState === 'copied')
                bValid = true;
            break;
        case 'copied':
            if (toState === 'cleaned')
                bValid = true;
    }
    return bValid;
}

var deleteJob = function (id) {
    var index = getJobIndex(id);
    if (index > -1) {
        rmdir(path.join(uploadDir, activeJobs[index].id.toString()), function (err) {
            if (err) { console.log(err); }
        });
        activeJobs.splice(index, 1);
        return true;
    }
    return false;
};

exports.init = function () {
    createDir(uploadDir);
    scanActiveJobs();
    for (var i in activeJobs) {
        scanUploadedFiles(activeJobs[i].id);
    }
};

exports.getJobDetail = function (id) {
    var index = getJobIndex(id);
    if (index > -1) {
        return activeJobs[index];
    } else {
        return null;
    }
};

exports.changeJobState = function (id, state) {
    var i = getJobIndex(id);
    if (i > -1) {
        if (validTransition(activeJobs[i].state, state)) {
            activeJobs[i].state = state;
            return true;
        }
    }
    return false;
};

exports.createJob = function () {
	var lastId = (activeJobs.length>0) ? (activeJobs[activeJobs.length - 1].id) : 0;
	var id = parseInt(lastId) + 1;
    createDir(path.join(uploadDir, id.toString()));
    activeJobs.push(new Job(id));
    return id;
};

exports.deleteJob = deleteJob;

exports.getActiveJobs = function () {
    return activeJobs;
};

exports.saveFile = function (jobId, fileName, fileContent, callback) {
    fs.writeFile(path.join(uploadDir, jobId.toString(), fileName), fileContent, function (err) {
        if (err) {
            console.log('error: ' + err);
        } else {
            var i = getJobIndex(jobId);
            if (i > -1 && activeJobs[i].files.indexOf(fileName)==-1) {
                activeJobs[i].files.push(fileName);
            }
        }
        callback(err);
    });
};

exports.getFilePath = function (jobId, fileName) {
    return path.join(uploadDir, jobId.toString(), fileName);
};

// ========================= clean job ========================
var cleanJob = function () {
    for (var i in activeJobs) {
        var diff = (new Date() - activeJobs[i].createdOn) / 60000;
        if (diff > cleanInterval) {
            console.log('cleaning job: ' + activeJobs[i].id);
            deleteJob(activeJobs[i].id);
        }
    }
};

var counter = setInterval(cleanJob, cleanInterval * 60000);