var request = require('supertest');
var should = require('should');

var app = require('../src/app').app;
var resources = require('../src/resources/resources.json');

describe('sarver up', function () {
    it('GET / - should return available api', function (done) {
        request(app)
          .get('/')
          .set('Accept', '*')
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .expect(200)
          .end(function (err, res) {
              should.not.exist(err);
              res.text.should.equal(resources.instruction.join('\n'));
              done();
          });
    });
});

describe('job', function () {
    it('GET /job - should return array of jobs', function (done) {
        request(app)
         .get('/job')
	     .set('Accept', 'application/json')
         .expect('Content-Type', /json/)
         .expect(200)
         .end(function (err, res) {
             should.not.exist(err);
             done();
         });
    });
});