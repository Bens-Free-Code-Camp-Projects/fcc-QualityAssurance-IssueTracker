const mongoose = require('mongoose')

const issueSchema = new mongoose.Schema({
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_on: { type: Date, required: true },
  updated_on: { type: Date, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, required: false },
  status_text: { type: String, required: false },
  open: { type: String, default: 'true', required: true}
})

const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true},
  issues: [issueSchema]
})

const Project = mongoose.model('Project', projectSchema)
const Issue = mongoose.model('Issue', issueSchema)

module.exports.Project = Project
module.exports.Issue = Issue