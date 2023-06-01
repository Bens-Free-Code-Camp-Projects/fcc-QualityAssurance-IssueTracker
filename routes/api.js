'use strict';
const Issue = require('../databaseSetup.js').Issue
const Project = require('../databaseSetup.js').Project

const mongoose = require('mongoose')

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res){

      let project = req.params.project;

      if(await Project.countDocuments({projectName: project}, { limit: 1 }) === 0){
        res.json({ error: 'This project does not yet exist. Please create an issue for this project first'})
        return
      }

      if(Object.keys(req.query).length === 0) {
        await Project.findOne({projectName: project}).then((found_project) => {
          res.send(found_project.issues)
          return
        }).catch((err) => {
          return console.error(err)
        })
      }else{

        const filter = []
        if(req.query.issue_title) {
          filter.push({'$eq': ['$$issues.issue_title', req.query.issue_title]})
        }
        if(req.query.issue_text) {
          filter.push({'$eq': ['$$issues.issue_text', req.query.issue_text]})
        }
        if(req.query.open) {
          filter.push({'$eq': ['$$issues.open', req.query.open]})
        }
        if(req.query.created_by){
          filter.push({'$eq': ['$$issues.created_by', req.query.created_by]})
        }
        if(req.query.created_on) {
          filter.push({'$eq': ['$$issues.created_on', new Date(req.query.created_on)]})
        }
        if(req.query.updated_on) {
          filter.push({'$eq': ['$$issues.updated_on', new Date(req.query.updated_on)]})
        }
        if(req.query.assigned_filter) {
          filter.push({'$eq': ['$$issues.assigned_to', req.query.assigned_filter]})
        }
        if(req.query.assigned_filter) {
          filter.push({'$eq': ['$$issues.status_text', req.query.assigned_filter]})
        }

        await Project.aggregate([
          {
            $match: { projectName: project }
          },
          {
            $project: {
              issues: {
                $filter: {
                  input: '$issues',
                  as: 'issues',
                  cond: {
                    $and: filter
                  }
                }
              }
            }
          }
        ]).then((project_aggregate) => {
          res.send(project_aggregate[0].issues)
          return
        }).catch((err) => {return console.error(err)})

      }
    })
    

    .post(async function (req, res){
      let project = req.params.project;

      if(await Project.countDocuments({projectName: project}, { limit: 1 }) === 0){
        console.log('adding new project')
        let myProject = new Project({
          projectName: project,
          issues: []
        })
        await myProject.save().catch((err) => {return console.error(err)})
      }
      if(!req.body.issue_title || !req.body.issue_text || !req.body.created_by) {
        res.json({ error: 'required field(s) missing' })
        return
      }

      let issue_title = req.body.issue_title;
      let issue_text = req.body.issue_text;
      let created_by = req.body.created_by;
      let assigned_to = req.body.assigned_to ? req.body.assigned_to : '';
      let status_text = req.body.status_text ? req.body.status_text: '';

      let newIssue = new Issue({
        issue_title: issue_title,
        issue_text: issue_text,
        created_by: created_by,
        created_on: Date.now(),
        updated_on: Date.now(),
        assigned_to: assigned_to,
        status_text: status_text,
        open: 'true'
      })

      await Project.findOneAndUpdate({projectName: project}).then((found_project) => {
        found_project.issues.push(newIssue)
        found_project.save().catch((err) => {return console.error(err)})
      }).then(() => {
        res.json(newIssue)
      }).catch((err) => {return console.error(err)})
    })
    
    .put(async function (req, res){
      let project = req.params.project;

      if(!req.body._id) {
        res.json({ error: 'missing _id' })
        return
      }
      let _idToUpdate = new mongoose.Types.ObjectId(req.body._id)

      if(!(req.body.issue_title || req.body.issue_text || req.body.assigned_to || req.body.created_by || req.body.status_text) && req.body.open !== false){
        res.json({ error: 'no update field(s) sent', '_id': _idToUpdate })
        return
      }

      let fieldsToUpdate = {
        'issues.$.updated_on': Date.now()
      }
      if(req.body.open !== undefined){
        fieldsToUpdate['issues.$.open'] = 'false'
      }
      if(req.body.issue_title) {
        fieldsToUpdate['issues.$.issue_title'] = req.body.issue_title
      }
      if(req.body.issue_text) {
        fieldsToUpdate['issues.$.issue_text'] = req.body.issue_text
      }
      if(req.body.created_by) {
        fieldsToUpdate['issues.$.created_by'] = req.body.created_by
      }
      if(req.body.assigned_to) {
        fieldsToUpdate['issues.$.assigned_to'] = req.body.assigned_to
      }
      if(req.body.status_text) {
        fieldsToUpdate['issues.$.status_text'] = req.body.status_text
      }

      await Project.updateOne(
      {
        projectName: project,
        issues: { $elemMatch: { _id: _idToUpdate }}
      },
      {
        $set: fieldsToUpdate
      }).then((doc) => {
        if(doc.modifiedCount === 0){
          res.json({ error: 'could not update', '_id': _idToUpdate})
          return
        }
        res.json({  result: 'successfully updated', '_id': _idToUpdate })
      }).catch((err) => {
        console.error(err)
        res.json({ error: 'could not update', '_id': _idToUpdate })})
    })
    
    .delete(async function (req, res){
      let project = req.params.project;

      if(!req.body._id){
        res.json({ error: 'missing _id' })
        return
      }

      let _idToDelete = new mongoose.Types.ObjectId(req.body._id)

      await Project.updateOne({projectName: project}, {
        $pull: {
          issues: {
            _id: _idToDelete
          }
        }
      }).then((doc) => {
        if(doc.modifiedCount === 0){
          res.json({ error: 'could not delete', '_id': _idToDelete })
          return
        }
        res.json({ result: 'successfully deleted', '_id': _idToDelete })
      }).catch((err) => {
        console.error(err)
        res.json({ error: 'could not delete', '_id': _idToDelete })
      })
    }); 
};
