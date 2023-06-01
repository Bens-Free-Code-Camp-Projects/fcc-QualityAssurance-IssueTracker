const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose')
const Project = require('../databaseSetup.js').Project
const Issue = require('../databaseSetup.js').Issue

chai.use(chaiHttp);

let _idToTest
let wrong_id = new mongoose.Types.ObjectId().toString()
let idsToDelete = []

suite('Functional Tests', async function() {
    before('set up the test cases in database', () => {
        let newIssue = new Issue({
            issue_title: 'Setup',
            issue_text: 'Setup',
            created_by: 'Ben',
            created_on: Date.now(),
            updated_on: Date.now(),
            assigned_to: '',
            status_text: '',
            open: 'true'
          })
          _idToTest = newIssue._id.toString()
    
        Project.findOneAndUpdate({projectName: 'apitest'}).then((found_project) => {
            found_project.issues.push(newIssue)
            found_project.save().catch((err) => {return console.error(err)})
          }).catch((err) => {return console.error(err)})
    })

    after('remove test cases from database', () => {
        Project.collection.drop()
        Issue.collection.drop()
    })
    


    test('Create an issue with every field: POST request to /api/issues/{project}', function(done) {
        chai.request(server)
        .post('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
                issue_title: 'Test1 title',
                issue_text: 'Test1 text',
                created_by: 'Ben',
                assigned_to: 'Somebody',
                status_text: 'status text'
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.issue_title, 'Test1 title');
            assert.equal(res.body.issue_text, 'Test1 text');
            assert.equal(res.body.created_by, 'Ben');
            assert.equal(res.body.assigned_to, 'Somebody');
            assert.equal(res.body.status_text, 'status text');
            assert.equal(res.body.open, 'true');
            assert.isDefined(res.body._id);
            assert.approximately(Date.parse(res.body.created_on), Date.now(), 100);
            assert.approximately(Date.parse(res.body.updated_on), Date.now(), 100);
            idsToDelete.push(res.body._id)
            done();
      })
    });
    test('Create an issue with only required fields: POST request to /api/issues/{project}', function(done) {
        chai.request(server)
        .post('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
                issue_title: 'Test2 title',
                issue_text: 'Test2 text',
                created_by: 'Ben'
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.issue_title, 'Test2 title');
            assert.equal(res.body.issue_text, 'Test2 text');
            assert.equal(res.body.created_by, 'Ben');
            assert.equal(res.body.assigned_to, '');
            assert.equal(res.body.status_text, '');
            assert.equal(res.body.open, 'true');
            assert.isDefined(res.body._id);
            assert.approximately(Date.parse(res.body.created_on), Date.now(), 100);
            assert.approximately(Date.parse(res.body.updated_on), Date.now(), 100);
            idsToDelete.push(res.body._id)
            done();
      })
    });
    test('Create an issue with missing required fields: POST request to /api/issues/{project}', function(done) {
        chai.request(server)
        .post('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
                issue_title: 'Test3 title',
                issue_text: 'Test3 text'
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.error, 'required field(s) missing')
            done();
      })
    });
    test('View issues on a project: GET request to /api/issues/{project}', function(done) {
        chai.request(server).get('/api/issues/apitest').end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[1].issue_title, 'Test1 title');
            assert.equal(res.body[1].issue_text, 'Test1 text');
            assert.equal(res.body[1].created_by, 'Ben');
            assert.equal(res.body[1].assigned_to, 'Somebody');
            assert.equal(res.body[1].status_text, 'status text');
            assert.equal(res.body[1].open, 'true');
            assert.isDefined(res.body[1]._id);
            assert.isDefined(res.body[1].created_on);
            assert.isDefined(res.body[1].updated_on);
            assert.equal(res.body[2].issue_title, 'Test2 title');
            assert.equal(res.body[2].issue_text, 'Test2 text');
            assert.equal(res.body[2].created_by, 'Ben');
            assert.equal(res.body[2].assigned_to, '');
            assert.equal(res.body[2].status_text, '');
            assert.equal(res.body[2].open, 'true');
            assert.isDefined(res.body[2]._id);
            assert.isDefined(res.body[2].created_on);
            assert.isDefined(res.body[2].updated_on);
            done();
        })
    });
    test('View issues on a project with one filter: GET request to /api/issues/{project}', function(done) {
        chai.request(server).get('/api/issues/apitest').query({ issue_title: 'Test2 title'}).end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[0].issue_title, 'Test2 title');
            assert.equal(res.body[0].issue_text, 'Test2 text');
            assert.equal(res.body[0].created_by, 'Ben');
            assert.equal(res.body[0].assigned_to, '');
            assert.equal(res.body[0].status_text, '');
            assert.equal(res.body[0].open, 'true');
            assert.isDefined(res.body[0]._id);
            assert.isDefined(res.body[0].created_on);
            assert.isDefined(res.body[0].updated_on);
            done();
        })
    });
    test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function(done) {
        chai.request(server).get('/api/issues/apitest').query({ issue_title: 'Test2 title', issue_text: 'Test2 text'}).end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[0].issue_title, 'Test2 title');
            assert.equal(res.body[0].issue_text, 'Test2 text');
            assert.equal(res.body[0].created_by, 'Ben');
            assert.equal(res.body[0].assigned_to, '');
            assert.equal(res.body[0].status_text, '');
            assert.equal(res.body[0].open, 'true');
            assert.isDefined(res.body[0]._id);
            assert.isDefined(res.body[0].created_on);
            assert.isDefined(res.body[0].updated_on);
            done();
        })
    });
    test('Update one field on an issue: PUT request to /api/issues/{project}', function(done) {
        chai.request(server)
        .put('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
                _id: _idToTest,
                issue_title: 'Test7'
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.result, 'successfully updated')
            assert.equal(res.body._id, _idToTest)
      })


      chai.request(server).get('/api/issues/apitest').end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.equal(res.body[0].issue_title, 'Test7');
        assert.equal(res.body[0].issue_text, 'Setup');
        assert.equal(res.body[0].created_by, 'Ben');
        assert.equal(res.body[0].assigned_to, '');
        assert.equal(res.body[0].status_text, '');
        assert.equal(res.body[0].open, 'true');
        assert.isDefined(res.body[0]._id);
        assert.isDefined(res.body[0].created_on);
        assert.isDefined(res.body[0].updated_on);
        assert.notEqual(res.body[0].created_on, res.body[0].updated_on)
        done();
    })
    });

    test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function(done) {
        chai.request(server)
        .put('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
                _id: _idToTest,
                issue_title: 'Test8',
                issue_text: 'Test8'
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.result, 'successfully updated')
            assert.equal(res.body._id, _idToTest)
      })


      chai.request(server).get('/api/issues/apitest').end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.equal(res.body[0].issue_title, 'Test8');
        assert.equal(res.body[0].issue_text, 'Test8');
        assert.equal(res.body[0].created_by, 'Ben');
        assert.equal(res.body[0].assigned_to, '');
        assert.equal(res.body[0].status_text, '');
        assert.equal(res.body[0].open, 'true');
        assert.isDefined(res.body[0]._id);
        assert.isDefined(res.body[0].created_on);
        assert.isDefined(res.body[0].updated_on);
        assert.notEqual(res.body[0].created_on, res.body[0].updated_on)
        done();
    })
    });

    test('Update an issue with missing _id: PUT request to /api/issues/{project}', function(done) {
        chai.request(server)
        .put('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
                issue_title: 'Test9',
                issue_text: 'Test9'
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.error, 'missing _id')
            done();
      })
    });

    test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function(done) {
        chai.request(server)
        .put('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
                _id: _idToTest
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.error, 'no update field(s) sent')
            assert.equal(res.body._id, _idToTest)
            done();
      })
    });

    test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function(done) {
        chai.request(server)
        .put('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
                _id: wrong_id,
                issue_title: 'Test10',
                issue_text: 'Test10'
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.error, 'could not update')
            assert.equal(res.body._id, wrong_id)
            done();
      })
    });

    test('Delete an issue: DELETE request to /api/issues/{project}', function(done) {
        chai.request(server)
        .delete('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            _id: _idToTest
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.result, 'successfully deleted')
            assert.equal(res.body._id, _idToTest)
            done();
        })
    });

    test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function(done) {
        chai.request(server)
        .delete('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            _id: wrong_id
        })
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.error, 'could not delete')
            assert.equal(res.body._id, wrong_id)
            done()
        })
    });

    test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function(done) {
        chai.request(server)
        .delete('/api/issues/apitest')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({})
        .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.error, 'missing _id')
            done()
        })
    });
});
