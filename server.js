// added new fact addition methods , these methods use significantly less
// bandwidth than traditional POST methods

const express = require("express");
const path = require("path");
const limiter = require("express-rate-limit")({
  windowMs: 60 * 1000,
  max: 6000,
  message:
    "<h1 style='position:absolute; top:50%; left:50%; transform: translate(-50%, -50%); text-align:center; color:#c00000; font-family:monospace;'><p style='color:red;'>You have exceeded 6 Request per minute quota.</p>Please try again after a minute</h1>",
});
const fs = require("fs");
const factsDataStoreName = "./crs-pltf/facts.json";
const factsDataStore = require(factsDataStoreName);
const app = express();
const PORT = process.env.PORT ?? 5000;

//initial setup
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

//handling functions
function randomFact() {
  i = Math.floor(Math.random() * factsDataStore.total);
  fact = factsDataStore.facts[i];
  return fact;
}

function getFactById(id) {
  let factGot = {
    id: NaN,
    type: "Error",
    content: "Invalid id",
  };
  factsDataStore.facts.forEach((fact) => {
    if (fact.id == id) factGot = fact;
  });
  return factGot;
}

function getFactByType(type) {
  let factOfType = [];
  let result = [];
  factsDataStore.facts.forEach((fact) => {
    if (fact.type == type) {
      factOfType.push(fact);
    }
  });

  if (factOfType.length == 0)
    factOfType.push({
      id: NaN,
      type: "Error",
      content: "No facts of type `" + type + "` found",
    });

  result = factOfType[Math.floor(Math.random() * factOfType.length)];

  return result;
}

function getFactsByType(type, amt) {
  amt = amt ?? 1;
  let factOfType = [];
  let result = [];
  factsDataStore.facts.forEach((fact) => {
    if (fact.type == type) {
      factOfType.push(fact);
    }
  });

  for (i = 0; i < amt; i++) {
    if (factOfType.length == 0) {
      result.push({
        id: NaN,
        type: "Error",
        content: "No facts of type `" + type + "` found",
      });
      break;
    }
    rn = Math.floor(Math.random() * factOfType.length);
    result.push(factOfType[rn]);
    factOfType.splice(rn, 1);
  }
  return { found: result.length, facts: result };
}

function setNewFact(type = null, content = null, res, deprecated) {
  if (
    type == null ||
    type == undefined ||
    content == null ||
    content == undefined
  ) {
    res.send("Failed");
    return false;
  }
  let fact = { id: ++factsDataStore.total, type, content };
  factsDataStore.facts.push(fact);
  fs.writeFileSync(factsDataStoreName, JSON.stringify(factsDataStore, null, 4));
  if (deprecated) {
    res.send(
      "Success , /addfact endpoint is deprecated , use new stable /addfactv2 endpoint"
    );
  } else {
    res.send("Success");
  }
}

//routes
app.use("/all", limiter, (req, res, next) => {
  res.json(factsDataStore);
});

app.use("/random", limiter, (req, res, next) => {
  res.json(randomFact());
});

app.use("/id/:id", limiter, (req, res, next) => {
  res.json(getFactById(req.params.id));
});

app.use("/type/:type/:amt", limiter, (req, res, next) => {
  res.json(getFactsByType(req.params.type, req.params.amt));
});

app.use("/type/:type", limiter, (req, res, next) => {
  res.json(getFactByType(req.params.type));
});

app.use("/subPortal", function (req, res) {
  res.sendFile(path.join(__dirname, "./public/newfact.html"));
});
app.use("/subPortalv2", function (req, res) {
  res.sendFile(path.join(__dirname, "./public/newfactv2.html"));
});
// deprecated fact addition endpoint
app.post("/addFact", express.urlencoded(), (req, res, next) => {
  console.log(req.body.fct_typ);
  console.log(req.body.fct_con);
  setNewFact(req.body.fct_typ.toLowerCase(), req.body.fct_con, res, true);
});
// new stable fact addition endpoint
app.get("/addfactv2/:type::content", (req, res) => {
  console.log("got a fact from v2");
  setNewFact(req.params.type.toLowerCase(), req.params.content, res);
});
app.get("/trial", (req, res) => {
  console.log("trial successful");
  res.send("trial successful");
});
app.use("/", (req, res, next) => {
  res.sendFile(path.join(__dirname, "./public/home.html"));
});

//start server
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
