const http = require('http'); const hostname = '127.0.0.1'; const port =
3003;
const MongoClient = require('mongodb').MongoClient;
const mbxClient = require('@mapbox/mapbox-sdk');
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions')
const assert = require('assert');


const MAPBOX_TOKEN = 'pk.eyJ1IjoidHJpY2tlZG91dGRhdmlkIiwiYSI6ImNqZ3F0ZXI2dDAwcG0yd3F0bGRqMHExZ2QifQ.YyJvoum5vu7FGydTYqlfUg'
const baseClient = mbxClient({ accessToken: MAPBOX_TOKEN });
const directionsService = mbxDirections(baseClient)

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  let username = encodeURIComponent("full")
  let password = encodeURIComponent("charlie1*")
  MongoClient.connect("mongodb://"+username+":"+password+"@iad1-mongos0.objectrocket.com:16064/citibikedata?authMechanism=DEFAULT", function(err, client) {
    console.log("Connected correctly to server");
    const db = client.db('citibikedata')
    const col = db.collection('citibikedata');
    col.find({starttime:new RegExp('^2018-05-06'), geometry : { "$exists" : false }}).limit(60).toArray((err, docs)=>{
      for (let doc of docs){
        if ( !doc.hasOwnProperty('geometry') ){
          let config = {
            profile: 'cycling',
            waypoints: [{coordinates:[doc['start station longitude'],doc['start station latitude']]},{coordinates:[doc['end station longitude'],doc['end station latitude']]}],
            geometries: "geojson"
          }
          directionsService.getDirections(config).send().then(resp=>{
            console.log("mapbox request sent")
            let newdoc = {...doc, geometry: resp.body.routes[0].geometry}
            col.updateOne(doc, {$set: newdoc}, function(err, r){
              if (err){
                console.log(err)
              }
              console.log("success I think?")
            })
          },err=>console.log(err))
        }
      }

      //client.close()
    })
      // const collection = db.collection('citibikedata');
      // // Find some documents
      // collection.find({'bikeid': 32144}).toArray((err, docs)=> {
      //   console.log("Found the following records");
      //   console.log(docs);
      // });

  });
  res.end('Hello World\n');
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
