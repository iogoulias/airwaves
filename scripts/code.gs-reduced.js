function DELETE_TRIGGERS(functionName) {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function (entry) {

        if (entry.getHandlerFunction() == functionName) {
            console.log("deleted trigger" + entry.getHandlerFunction());
            ScriptApp.deleteTrigger(entry);
        }
    });
}


function DailyInit() {
    Init();
}

function deleteinit() {
    DELETE_TRIGGERS("Init");
}

function Init() {
    DELETE_TRIGGERS("Init");
    var starttime = (new Date()).getTime();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tracks");
    var lastRow = sheet.getLastRow();
    var migrated = sheet.getRange(1, 1, lastRow, 1).getValues();
    var migratedobj = {};
    for (var i = 0; i < migrated.length; i++) {
        migratedobj[migrated[i]] = 1;
    }
    // var q="mimeType = 'audio/mpeg' and ('hey@russellbishop.co.uk' in owners or 'music@russellbishop.co.uk' in owners )" ;
    var q = "mimeType = 'audio/mpeg'";
    var url = "https://www.googleapis.com/drive/v3/files?pageSize=1000&q=" + encodeURIComponent(q) + "&access_token=" + ScriptApp.getOAuthToken();
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    var obj = JSON.parse(res);
    var foundfiles = obj.files;
    var nexttoken = obj.nextPageToken;
    while (nexttoken != null) {
        console.log(nexttoken)
        //  var q="mimeType = 'audio/mpeg' and ('hey@russellbishop.co.uk' in owners or 'music@russellbishop.co.uk' in owners )" ;
        var q = "mimeType = 'audio/mpeg'";
        var url = "https://www.googleapis.com/drive/v3/files?pageSize=1000&pageToken=" + nexttoken + "&q=" + encodeURIComponent(q) + "&access_token=" + ScriptApp.getOAuthToken();
        var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

        var obj = JSON.parse(res);
        console.log(JSON.stringify(obj))
        foundfiles = foundfiles.concat(obj.files);
        if (obj.hasOwnProperty("nextPageToken")) {
            nexttoken = obj.nextPageToken;
        } else {
            nexttoken = null;
        }
    }
    console.log("foundfiles: ")
    console.log(foundfiles)
    var foundfilesnew = [];
    var foundfilesnewids = [];
    for (var i = 0; i < foundfiles.length; i++) {
        console.log(foundfiles[i])
        console.log(typeof foundfiles[i])
        if (typeof foundfiles[i] == "object" && (foundfiles[i]).hasOwnProperty("id") && !migratedobj.hasOwnProperty(((foundfiles[i])["id"]))) {
            foundfilesnew.push(foundfiles[i]);
            foundfilesnewids.push([foundfiles[i]["id"]])
        }
    }
    var addedrows = 0;
    console.log("Total files: " + foundfilesnew.length);
    // while (foundfilesnew.length>0) {
    try {
        var respapi = sample2({ "files": (foundfilesnew).slice(0, 5) }, starttime);
        var temp_foundfilesnewids = foundfilesnewids.slice(0, 5);
        var successfull_foundfilenewids = [];
        for (var l = 0; l < temp_foundfilesnewids.length; l++) {
            console.log(JSON.stringify(respapi[l]))
            if ((respapi[l]).hasOwnProperty("result") && respapi[l]["result"] == "ok") {
                successfull_foundfilenewids.push(temp_foundfilesnewids[l])
            }
        }
        sheet.getRange(lastRow + addedrows + 1, 1, (successfull_foundfilenewids).length, 1).setValues(successfull_foundfilenewids)
        addedrows = addedrows + (successfull_foundfilenewids).length
        foundfilesnew = foundfilesnew.slice(5);
        foundfilesnewids = foundfilesnewids.slice(5);
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

function sample2(obj, starttime) {

    var results = [];
    for (var i = 0; i < obj.files.length; i++) {


        var temp = {};
        temp["name"] = obj.files[i]["name"];
        temp["id"] = obj.files[i]["id"];
        results.push(temp)

    }

    var count = 0;
    var batchRequest = [];
    var tempbatchRequest = [];
    while (results.length > 0) {

        tempbatchRequest.push(AddAirtableRequest(results.slice(0, 1)))

        results = results.slice(1);
    }
    if (tempbatchRequest.length > 0) {
        batchRequest = tempbatchRequest;
        //tempbatchRequest=[];
    }
    var batchResponse = [];
    for (var i = 0; i < batchRequest.length; i++) {
        console.log(JSON.stringify(batchRequest[i]))
        var Airtableresponse = UrlFetchApp.fetchAll(batchRequest[i]);
        Utilities.sleep(1000)
        batchResponse = batchResponse.concat(Airtableresponse)
    }
    for (var i = 0; i < batchResponse.length; i++) {
        try {
            batchResponse[i] = JSON.parse((batchResponse[i]).getContentText())
        } catch (e) {
            batchResponse[i] = { "result": "unexpected error" }
        }

    }
    return batchResponse
    // DriveApp.getFiles() // This line is put for automatically detecting the scope (https://www.googleapis.com/auth/drive.readonly) for this script.
}

function AddAirtableRequest(payload) {
    var requests = [];
    for (var j = 0; j < payload.length; j++) {
        var request = {
            'url': "https://airwaves-rw4kx.ondigitalocean.app/artwork?id=" + (payload[j])["id"] + "&file=" + (payload[j])["name"],
            'method': 'GET',
            "muteHttpExceptions": true
        };
        requests.push(request);
    }

    return requests;
}