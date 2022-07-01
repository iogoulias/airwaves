function DELETE_TRIGGERS(functionName) {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(entry) {
      
        if (entry.getHandlerFunction() == functionName) {
          console.log("deleted trigger" + entry.getHandlerFunction());
            ScriptApp.deleteTrigger(entry);
        }
    });
}



function testsymbols() {
// 1pk2tHrhZdlMnDgDC1lJSStLlZ9K7xWiZ
  var res=ID3extract("1-VDeeEk3IcwZmigaX3Sy4Sd3_9FS5wg2")
  console.log(res["TP1"])

}
function istimeout(starttime) {

  if ((new Date()).getTime()-starttime<300000) {
    return false;
  } else {
  return true;
  }
}


function DailyInit() {
Init();
}
function deleteinit () {
DELETE_TRIGGERS("Init");
}
function Init() {
  DELETE_TRIGGERS("Init");
  var starttime= (new Date()).getTime();
  var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tracks");
  var lastRow=sheet.getLastRow();
  var migrated=sheet.getRange(1, 1, lastRow, 1).getValues();
  var migratedobj={};
  for (var i=0;i<migrated.length;i++) {
       migratedobj[migrated[i]]=1;
       }
 // var q="mimeType = 'audio/mpeg' and ('hey@russellbishop.co.uk' in owners or 'music@russellbishop.co.uk' in owners )" ;
   var q="mimeType = 'audio/mpeg'";
  var url = "https://www.googleapis.com/drive/v3/files?pageSize=1000&q=" + encodeURIComponent(q) + "&access_token=" + ScriptApp.getOAuthToken();
  var res = UrlFetchApp.fetch(url,{muteHttpExceptions:true});

  var obj = JSON.parse(res);
  var foundfiles=obj.files;
  var nexttoken=obj.nextPageToken;
  while (nexttoken!=null) {
    console.log(nexttoken)
  //  var q="mimeType = 'audio/mpeg' and ('hey@russellbishop.co.uk' in owners or 'music@russellbishop.co.uk' in owners )" ;
       var q="mimeType = 'audio/mpeg'";
  var url = "https://www.googleapis.com/drive/v3/files?pageSize=1000&pageToken="+nexttoken+"&q=" + encodeURIComponent(q) + "&access_token=" + ScriptApp.getOAuthToken();
  var res = UrlFetchApp.fetch(url,{muteHttpExceptions:true});
 
  var obj = JSON.parse(res);
    console.log(JSON.stringify(obj))
   foundfiles=foundfiles.concat(obj.files);
    if (obj.hasOwnProperty("nextPageToken"))  {
     nexttoken=obj.nextPageToken;
    } else {
     nexttoken=null;
    }
  }
  console.log("foundfiles: ")
  console.log(foundfiles)
  var foundfilesnew=[];
  var foundfilesnewids=[];
  for (var i=0;i<foundfiles.length;i++) {
    console.log(foundfiles[i])
    console.log(typeof foundfiles[i])
    if (typeof foundfiles[i]=="object" && (foundfiles[i]).hasOwnProperty("id") && !migratedobj.hasOwnProperty(((foundfiles[i])["id"]))) {
    foundfilesnew.push(foundfiles[i]);
    foundfilesnewids.push([foundfiles[i]["id"]])
    }
       }
  var addedrows=0;
  console.log("Total files: "+foundfilesnew.length);
 // while (foundfilesnew.length>0) {
  try {
  var respapi=sample2({"files":(foundfilesnew).slice(0,5)},starttime);
  var temp_foundfilesnewids=foundfilesnewids.slice(0,5);
  var successfull_foundfilenewids=[];
    for (var l=0;l<temp_foundfilesnewids.length;l++) {
      console.log(JSON.stringify(respapi[l]))
      if ((respapi[l]).hasOwnProperty("result") && respapi[l]["result"]=="ok" ) {
         successfull_foundfilenewids.push(temp_foundfilesnewids[l])
      }
         }
  sheet.getRange(lastRow+addedrows+1, 1, (successfull_foundfilenewids).length, 1).setValues(successfull_foundfilenewids)
  addedrows=addedrows+(successfull_foundfilenewids).length
  foundfilesnew=foundfilesnew.slice(5);
  foundfilesnewids=foundfilesnewids.slice(5);
  } catch (e) {
  console.log(e)
  }
  //throw "stop"
  //}
      DELETE_TRIGGERS("Init");
    ScriptApp.newTrigger("Init")
      .timeBased()
      .everyMinutes(1)
      .create();
    console.log("created trigger");
}

function sample2(obj,starttime) {

  var results=[];
  for (var i = 0; i < obj.files.length; i++) {

      
     var temp={};
    temp["name"]=obj.files[i]["name"];
    temp["id"]=obj.files[i]["id"];
    results.push(temp)

     }

 var count=0;
 var batchRequest=[];
 var tempbatchRequest=[];
 while (results.length>0) {

 tempbatchRequest.push(AddAirtableRequest(results.slice(0,1)))

 results=results.slice(1);
 }
  if (tempbatchRequest.length>0) {
  batchRequest=tempbatchRequest;
  //tempbatchRequest=[];
  }
  var batchResponse=[];
  for (var i=0;i<batchRequest.length;i++) {
       console.log(JSON.stringify(batchRequest[i]))
       var Airtableresponse=UrlFetchApp.fetchAll(batchRequest[i]);
	   Utilities.sleep(1000)
          batchResponse=batchResponse.concat(Airtableresponse)
       }
  for (var i=0;i<batchResponse.length;i++) {
    try {
    batchResponse[i]=JSON.parse((batchResponse[i]).getContentText())
    } catch (e) {
      batchResponse[i]={"result":"unexpected error"}
    }
   
  }
 return batchResponse
  // DriveApp.getFiles() // This line is put for automatically detecting the scope (https://www.googleapis.com/auth/drive.readonly) for this script.
}


 function AddAirtableRequest(payload) {
  var requests=[];
  for (var j=0;j<payload.length;j++) {
      var request = {
    
      'url': "https://airwaves-rw4kx.ondigitalocean.app/artwork?id="+(payload[j])["id"]+"&file="+(payload[j])["name"],
      'method' : 'GET',
          "muteHttpExceptions":true
      }; 
    requests.push(request);
  }

  return requests;
}

// can't find a reference
function createAirtableRecords(requestbatch) {
  var temprequest={"records":[]}
  for (var i=0;i<requestbatch.length;i++) {
    var tempfields={"fields":{}};
    if ((requestbatch[i]).hasOwnProperty("album") && requestbatch[i]["album"]!="" ) {
      tempfields["fields"]["Album"]=requestbatch[i]["album"]
    }
    if ((requestbatch[i]).hasOwnProperty("artist") && requestbatch[i]["artist"]!="") {
      tempfields["fields"]["Artist"]=requestbatch[i]["artist"]
    }
    if ((requestbatch[i]).hasOwnProperty("duration") && requestbatch[i]["duration"]!="") {
      tempfields["fields"]["Duration"]=parseInt(requestbatch[i]["duration"]);
    }
    if ((requestbatch[i]).hasOwnProperty("trackname") && requestbatch[i]["trackname"]!="") {
      tempfields["fields"]["Track Name"]=(requestbatch[i]["trackname"]);
    }
    tempfields["fields"]["File ID"]=requestbatch[i]["id"];
    tempfields["fields"]["File Name"]=requestbatch[i]["name"];
    (temprequest["records"]).push(tempfields);
       }

  return AddAirtableRequest(temprequest)
}



function oldID3extract (fileid) {
  var result={};
  var retry=true;
 // while (retry) {
  try {
  var ID3=(String(DriveApp.getFileById(fileid).getBlob().getDataAsString()).replace(/[^A-Za-z0-9\.\s]+/g, '$'));
  ID3=ID3.replace('ID3','');
  console.log(ID3);
  retry=false;
  } catch (e1) {
    console.log(e1)
    console.log(String(e1).indexOf("exceeds the maximum file size"))
    if (String(e1).indexOf("exceeds the maximum file size")>-1) {
    retry=false;
    } else {
  Utilities.sleep(1000)
    }
  }
 // }
  
  //var tagvalues = ID3.split(/(\$(([A-Z]){3}([A-Z0-9_-]){1}){1}\$){1}/g);
  //var tagnames = ID3.match(/(\$(([A-Z]){3}([A-Z0-9_-]){1}){1}\$){1}/g);
  var tagnames=ID3.match(/APIC-1|APIC-2|APIC-3|APIC|COMM|GRP1|IPLS|ITNU|MCDI|MVIN|MVNM|OWNE|PCNT|PCST|POPM|PRIV|SYLT|TALB|TBPM|TCAT|TCMP|TCOM|TCON|TCOP|TDAT|TDES|TDLY|TENC|TEXT|TFLT|TGID|TIME|TIT1|TIT2|TIT3|TKEY|TKWD|TLAN|TLEN|TMED|TOAL|TOFN|TOLY|TOPE|TORY|TOWN|TPE1|TPE2|TPE3|TPE4|TPOS|TPUB|TRCK|TRDA|TRSN|TRSO|TSIZ|TSO2|TSOC|TSRC|TSSE|TXXX|TYER|USER|USLT|WCOM|WCOP|WFED|WOAF|WOAR|WOAS|WORS|WPAY|WPUB|WXXX|XDOR|XOLY|XSOA|XSOP|XSOT|RVA2|TDEN|TDOR|TDRC|TDRL|TDTG|TIPL|TMCL|TMOO|TPRO|TSOA|TSOP|TSOT|TSST|CNT|COM|IPL|ITU|PCS|PIC-1|PIC-2|PIC-3|PIC|POP|RVA|SLT|TAL|TBP|TCM|TCO|TCP|TCR|TDA|TDY|TEN|TFT|TIM|TKE|TLA|TLE|TMT|TOA|TOF|TOL|TOR|TOT|TP1|TP2|TP3|TP4|TPA|TPB|TRC|TRD|TRK|TS2|TSA|TSC|TSI|TSP|TSS|TST|TT1|TT2|TT3|TXT|TXX|TYE|ULT|WAF|WAR|WAS|WCM|WCP|WPB|WXX/g)
  
  var found=ID3;
  var results=[];
  console.log(tagnames)
  for (var ii=0;ii<tagnames.length;ii++) {
    
   // 
   //var temp=found.substring(found.indexOf(tagnames[ii])+1);
  var temp=found.split(tagnames[ii]);
  if (ii>0) {
  results.push(temp[0])
  }
    if (temp.length>1) {
  found=temp[1]
    }
  }

  for (var ii=0;ii<tagnames.length;ii++) {
    if (!result.hasOwnProperty(tagnames[ii])) {
    result[tagnames[ii]]=String(results[ii]).replace(/\$/g,'');
    }
       
       }

 console.log(result)
return result  
}

function testID3extract() {


  //var test=(String(DriveApp.getFileById("1VkKfl1gHMp8KN522T9ckUbendN6VOFvs").getBlob().getDataAsString()).replace(/[^A-Za-z0-9\.\s]+/g, '$'));
 // var test=(DriveApp.getFileById("1VkKfl1gHMp8KN522T9ckUbendN6VOFvs").getBlob().getDataAsString()).split("JFIF");
  var bytearr=(((DriveApp.getFileById("1lN_yzNRUupWIVgRXNkp6M5343shkqVxG").getBlob().getBytes().join(",").split("-1,-40,-1,-32,0,16,74,70,73"))))
    console.log("bytearr[1]")
  //console.log(bytearr[1])
  var test="-1,-40,-1,-32,0,16,74,70,73"+bytearr[1];
  var newimage=Utilities.newBlob(test.split(",")).setContentType("image/jpeg");

  newimage.setName("testblob")
  //console.log(Utilities.base64Encode(test.split(",")))
  //DriveApp.createFile(Utilities.base64Encode(test.split(",")))
  DriveApp.createFile(newimage).getDownloadUrl();


}

function ID3extract (fileid) {
  var result={};
  var retry=true;
 // while (retry) {
  try {
  var ID3=(String(DriveApp.getFileById(fileid).getBlob().getDataAsString()).replace(/[^A-Za-z0-9\.\s]+/g, '$'));
  ID3=ID3.replace('ID3','');
  console.log(ID3);
  retry=false;
  } catch (e1) {
    console.log(e1)
    console.log(String(e1).indexOf("exceeds the maximum file size"))
    if (String(e1).indexOf("exceeds the maximum file size")>-1) {
    retry=false;
    } else {
  Utilities.sleep(1000)
    }
  }
 // }
  
  //var tagvalues = ID3.split(/(\$(([A-Z]){3}([A-Z0-9_-]){1}){1}\$){1}/g);
  //var tagnames = ID3.match(/(\$(([A-Z]){3}([A-Z0-9_-]){1}){1}\$){1}/g);
  var tagnames=ID3.match(/APIC-1|APIC-2|APIC-3|APIC|COMM|GRP1|IPLS|ITNU|MCDI|MVIN|MVNM|OWNE|PCNT|PCST|POPM|PRIV|SYLT|TALB|Info|TBPM|TCAT|TCMP|TCOM|TCON|TCOP|TDAT|TDES|TDLY|TENC|TEXT|TFLT|TGID|TIME|TIT1|TIT2|TIT3|TKEY|TKWD|TLAN|TLEN|TMED|TOAL|TOFN|TOLY|TOPE|TORY|TOWN|TPE1|TPE2|TPE3|TPE4|TPOS|TPUB|TRCK|TRDA|TRSN|TRSO|TSIZ|TSO2|TSOC|TSRC|TSSE|TXXX|TYER|USER|USLT|WCOM|WCOP|WFED|WOAF|WOAR|WOAS|WORS|WPAY|WPUB|WXXX|XDOR|XOLY|XSOA|XSOP|XSOT|RVA2|TDEN|TDOR|TDRC|TDRL|TDTG|TIPL|TMCL|TMOO|TPRO|TSOA|TSOP|TSOT|TSST|CNT|COM|IPL|ITU|PCS|PIC-1|PIC-2|PIC-3|PIC|POP|RVA|SLT|TAL|TBP|TCM|TCO|TCP|TCR|TDA|TDY|TEN|TFT|TIM|TKE|TLA|TLE|TMT|TOA|TOF|TOL|TOR|TOT|TP1|TP2|TP3|TP4|TPA|TPB|TRC|TRD|TRK|TS2|TSA|TSC|TSI|TSP|TSS|TST|TT1|TT2|TT3|TXT|TXX|TYE|ULT|WAF|WAR|WAS|WCM|WCP|WPB|WXX/g)
  
  var found=ID3;
  var results=[];
  console.log(tagnames)
  for (var ii=0;ii<tagnames.length;ii++) {
    
   // 
   //var temp=found.substring(found.indexOf(tagnames[ii])+1);
  var temp=found.split(tagnames[ii]);
  if (ii>0) {
  results.push(found.substring(0,found.indexOf(tagnames[ii])))
  }
    if (temp.length>1) {
  found=found.substring(found.indexOf(tagnames[ii])+(tagnames[ii]).length);
    }
  }

  for (var ii=0;ii<tagnames.length;ii++) {
    if (!result.hasOwnProperty(tagnames[ii])) {
    result[tagnames[ii]]=String(results[ii]).replace(/\$/g,'');
    }
       
       }

 console.log(result)
return result  
}