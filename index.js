//
// Alexa skill to check i80 road conditions
// @author: Ido Green | @greenido
// @date: March 2018
// @see https://greenido.wordpress.com/
//
//
var express = require("express");
var alexa = require("alexa-app");
var request = require("request");

var PORT = process.env.PORT || 3000;
var app = express();

// Setup the alexa app and attach it to express before anything else.
var alexaApp = new alexa.app("");
console.log("** Starting with building the i80 road conditions skill");

// Calling GA to make sure how many invocations we had on this skill
const GAurl = "https://ga-beacon.appspot.com/UA-65622529-1/highway-80-conditions-alexa-server/?pixel=0";
request.get(GAurl, (error, response, body) => {
  console.log(" - Called the GA " + new Date());
});

// POST calls to / in express will be handled by the app.request() function
alexaApp.express({
  expressApp: app,
  checkCert: true,
  // sets up a GET route when set to true. This is handy for testing in development, but not recommended for production.
  debug: true
});

// Show our developers what is going on with this skill
app.set("view engine", "ejs");

//
// Start the skill party
//
alexaApp.launch(function(request, response) {
  console.log("----> i80 road conditions skill launched");
  response.say('Hey! Do you wish to check the road conditions on highway 80?').shouldEndSession(false);
});

//
// The main 'road conditions' intent
//
alexaApp.intent("roadconditions", {
    "slots": {},
    "utterances": [
      "ya",
      "yep",
      "yes",
      "is the road to tahoe open",
      "can I get to truckee",
      "can I get to northstar",
      "yo",
      "hey",
      "is it close",
      "open",
      "is there snow on the highway",
      "can I get to tahoe",
      "is the road open"
    ]
  },
  function(req, response) {
    console.log("* In road conditions intent *");
    return getData()
      .then(function (body) {
        //console.log("====  "+ body + "\n======");
        try {  
          // Get the web page and clean the data so we could 'talk' it back to the user
          let html = body; 
          let inx1 = html.indexOf('<h2>') + 20;
          let inx2 = html.indexOf('<pre>', inx1) + 5; // we got 2 > to skip
          let inx3 = html.indexOf('</pre>', inx2); 
          let roadConditionsStr = html.substring(inx2, inx3).trim();
          roadConditionsStr = roadConditionsStr.replace(/\[/g, '');
          roadConditionsStr = roadConditionsStr.replace(/\]/g, '');
          roadConditionsStr = roadConditionsStr.replace(/CO/g, '');
          roadConditionsStr = roadConditionsStr.toLowerCase();
          roadConditionsStr = roadConditionsStr.replace(/in /g, 'In ');
          roadConditionsStr = roadConditionsStr.replace(/\r?\n|\r/g, ' ');
          roadConditionsStr = roadConditionsStr.replace(/i 80/g, 'Highway eighty are');
          roadConditionsStr = roadConditionsStr.replace(/  +/g, ' ');
          roadConditionsStr = roadConditionsStr.replace(/\&/g, 'and');
          console.log("== roadConditionsStr: " + roadConditionsStr + " =====");
      
          if (roadConditionsStr == null || roadConditionsStr.length < 3) {
            response.say("Could not get the road conditions. You can check with the Caltrans Highway Information Network at phone 800-427-7623. Have safe trip!").shouldEndSession(true);
            //saveToDB("ERROR - could not get the road conditions");
            return;
          }
          //roadConditionsStr = "Highway eighty In the san francis bay area - solano no traffic restrictions are reported for this area.";
          let res = "The current road conditions on " + roadConditionsStr + " Wish me to say it again?";
           // 'tell' (and not 'ask') as we don't wish to finish the conversation
          response.say(res).shouldEndSession(false);
          //assistant.ask(res);
          //saveToDB(roadConditionsStr);
        }
        catch(error) {
          console.log("(!) Error: " + error + " json: "+ JSON.stringify(error));
        }
      
        //response.say(resText).shouldEndSession(false);
      })
      .catch(function(err){
        console.log('ERR: ' + err);
        response.say("Could not get the road conditions. You can check with the Caltrans Highway Information Network at phone 800-427-7623. Have safe trip!").shouldEndSession(true);
      });
  }
);

//
// A promise to fetch the data from the gov site that updating it
//
function getData(endpoint) {  
  return new Promise(function(resolve, reject) {
    request({
      url: "http://www.dot.ca.gov/hq/roadinfo/display.php?page=i80",
      json: true
    }, function(err, res, body) {
      if (err || res.statusCode >= 400) {
        console.error(res.statusCode, err);
        return reject('Unable to get the road conditions at the moment. Sorry!');
      }
      if (!body) {
       return reject('Unable to get the road conditions at the moment. Sorry!');
      }
      resolve(body);
    });
  }); 
}

//
// Guide our users in case they asked for help
//
alexaApp.intent("AMAZON.HelpIntent", {
    "slots": {},
    "utterances": ["what can you do", "help"]
  }, function(request, response) {
    console.log("help intent");
  	response.say("I can tell you what are the road conditions on highway 80. Do you wish to hear it now?").shouldEndSession(false);
  	return;
  }
);

//
// The user wish to leave our skill
//
alexaApp.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": ["no", "nope", "bye",  "quit"]
  }, function(request, response) {
    console.log("Sent cancel response");
  	response.say("Ok, sure thing. Have safe trip!");
  	return;
  }
);

//
// The user wish to stop/leave our skill
//
alexaApp.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": [ "bye", "quit"]
  }, function(request, response) {
    console.log("Sent stop response");
  	response.say("Alright, I'll stop. See you later!");
  	return;
  }
);

//
//
//
alexaApp.sessionEnded(function(request, response) {
  console.log("(!) In sessionEnded");
  console.error('Alexa ended the session due to an error ' + JSON.stringify(response) + " == ");
});

//
// helper function to check for numbers
//
function isNumeric(n) { 
  return !isNaN(parseFloat(n)) && isFinite(n); 
}

//
// Start the party
//
app.listen(PORT, () => console.log("Our Alexa skill is Listening on port " + PORT + "."));