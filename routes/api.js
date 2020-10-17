/*
*       Complete the API routing below
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
//const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      let query = req.query;
      if (query._id) { query._id = new ObjectId(query._id)}
      if (query.open) { query.open = String(query.open) == "true" }
      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        
        const collection = client.db("Issue-Tracker").collection(project);
        collection.find(query).toArray(function(err,docs){res.json(docs)});
      });
    })
    

//2. I can POST /api/issues/{projectname} with form data containing required issue_title, 
// issue_text, created_by, and optional assigned_to and status_text.
//3. The object saved (and returned) will include all of those fields (blank for optional no input) 
//and also include created_on(date/time), updated_on(date/time), open(boolean, true for open, false for closed), and _id.
    .post(function (req, res){
      var project = req.params.project;
      let postedIssue = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text, 
        created_by: req.body.created_by, 
        assigned_to: req.body.assigned_to? req.body.assigned_to : "",
        status_text: req.body.status_text? req.body.status_text : "",
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };
      if(!postedIssue.issue_title || !postedIssue.issue_text || !postedIssue.created_by) {
          res.send('Missing required fields');
        } 
      else {
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          if (err) {return console.log("error: " + err); }

          const collection = client.db("Issue-Tracker").collection(project);
          collection.insertOne(postedIssue,function(err,doc){
            postedIssue._id = doc.insertedId;
            res.json(postedIssue);
          });
        });
      }
    })
    
  
    .put(function (req, res){
    var project = req.params.project;
      let issueId = req.body._id;
      delete req.body._id;
      let toUpdate = req.body;
    
      for (let item in toUpdate) { 
        if (!toUpdate[item]) { 
          delete toUpdate[item] 
        } 
      }
    
      if (toUpdate.open) { toUpdate.open = String(toUpdate.open) == "true" }
    
      if (Object.keys(toUpdate).length === 0) {
        res.send("no updated field sent");
      } 
      else {
        toUpdate.updated_on = new Date();
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          
          const collection = client.db("Issue-Tracker").collection(project);
          collection.findAndModify({_id:new ObjectId(issueId)},[["_id",1]],{$set: toUpdate},{new: true},function(err,doc){
            if (!err) 
            {
              res.send("successfully updated")
            }
            else {
              res.send("could not update " + issueId + " " + err);
            }
          });
        });    
      }
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      let issueId = req.body._id;
      if (!issueId) {
        res.send('_id error');
      } 
      else {
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          
          const collection = client.db("Issue-Tracker").collection(project);
          collection.findAndRemove({_id:new ObjectId(issueId)},function(err,doc){
            if (!err){
              res.send("deleted " + issueId)}
            else {
              res.send("could not delete " + issueId + " " + err);
            }
          });
        });
      }
    });
    
};
