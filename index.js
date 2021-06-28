var jsmediatags = require("jsmediatags");
var fs=require("fs");
const express = require("express");
const cloudinary = require("cloudinary");
var Airtable = require('airtable');
var base= new Airtable({apiKey:'keyll8LpyyN3adHhR'}).base('app6GHxtqv6bp7oBk');
cloudinary.config({ 
  cloud_name: 'dxpigklxv', 
  api_key: '463342247927238', 
  api_secret: 'IO4rR5Crlj4xoepb0cCDwUnKkeU' 
});
var bodyParser = require('body-parser');
var axios = require('axios');
var cors = require('cors');
const path = require('path');
var qs = require('qs');
const app = express();
let port = process.env.PORT || 3000;
const btoa = function(str){ return Buffer.from(str, 'binary').toString('base64'); };
app.get('/page', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.use(cors({origin: 'http://localhost:3000/*'}));
app.use(cors({origin: 'https://iogoulias.github.io'}))
app.use(cors({origin: '*'}))
app.use(bodyParser.urlencoded({
  extended: true
}));
app.get('/image', function(req, res) {
	console.log("requested");
  res.sendFile(path.join(__dirname, '/'+req.query.file));
});
app.get("/artwork", (req, res) => {
	var id=req.query.id;
	var file=req.query.file;
	jsmediatags.read("https://docs.google.com/uc?export=download&id="+id, {
  onSuccess: function(tag) {
    
	var image=null;
	if ((tag.tags).hasOwnProperty("picture")) {
	image = tag.tags.picture;	
	}
	var artist=null;
	if ((tag.tags).hasOwnProperty("artist")) {
	artist = tag.tags.artist;	
	}
	var album=null;
	if ((tag.tags).hasOwnProperty("album")) {
	album = tag.tags.album;	
	}
	var title=null;
	if ((tag.tags).hasOwnProperty("title")) {
	title = tag.tags.title;	
	}
	var duration=null;
	if ((tag.tags).hasOwnProperty("TLEN") && (tag.tags.TLEN).hasOwnProperty("data") ) {
	duration = tag.tags.TLEN.data;	
	}
      if (image!=null) {
	 var writeformat=((image.format).split("/"))[1];
	 if (writeformat=="jpeg") {	 
		 writeformat="jpg";
	 }
	 fs.writeFile(id+"."+writeformat,Buffer.from(image.data),"binary",function(){
		var temppath=path.dirname(require.main.filename)
		// cloudinary.v2.uploader.upload(id+"."+writeformat,
      //  { public_id: id }, 
       //  function(error, result) {console.log(result.secure_url);
       //  res.send(airtable({"File ID":id,"File Name":file,"Album Artwork":[{"url":result.secure_url}],"Artist":artist,"Album":album,"Track Name":title,"Duration":duration},id,true));	 
console.log(temppath+"\\"+id+"."+writeformat)
res.send(airtable({"File ID":id,"File Name":file,"Album Artwork":[{"url":temppath+"/"+id+"."+writeformat}],"Artist":artist,"Album":album,"Track Name":title,"Duration":duration},id,true));	 
		 
		// });
		 
		 
	 })
      } else {
		res.send(airtable({"File ID":id,"File Name":file,"Artist Artwork":null,"Artist":artist,"Album":album,"Track Name":title,"Duration":duration},id,false));
      }
  },
  onError: function(error) {
    console.log(':(', error.type, error.info);
  }
});
      
});

app.listen(port, () => {
       console.log('Example app is listening on port http://localhost:${port}')
});

function airtable(fields,id,hasimage) {
console.log("called airtable");
   base('TracksTestNewApp').create([
      {
      "fields": fields
   }
   ], function(err, records) {
   if (err) {
console.log(fields["File Name"])
    console.error(err);
  } 
  if (hasimage) {  
	//  cloudinary.uploader.destroy(id, function(result) { console.log(result) });
  }
  return true;
  });
}
