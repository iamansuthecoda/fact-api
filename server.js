const express = require('express');
const limiter = require('express-rate-limit')({windowMs: 60 * 1000, max: 6, message: "<h1 style='position:absolute; top:50%; left:50%; transform: translate(-50%, -50%); text-align:center; color:#c00000; font-family:monospace;'><p style='color:red;'>You have exceeded 6 Request per minute quota is exhausted.</p>Please try again after a minute</h1>"})
const factsData = require('./crs-pltf/facts.json')
const app = express();
const PORT = process.env.PORT ?? 5000;

//initial setup
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

//handling functions
function randomFact() {
    i = Math.floor(Math.random() * factsData.total);
    fact = factsData.facts[i];
    return fact;
}

function getFactById(id) {
    let factGot = {
        id: NaN,
        type: "Error",
        content: "Invalid id"
    };
    factsData.facts.forEach((fact) => {
        if (fact.id == id) factGot = fact;
    })
    return factGot;
}

function getFactByType(type) {
    let factOfType = [];
    let result = [];
    factsData.facts.forEach((fact) => {
        if (fact.type == type) {
            factOfType.push(fact)
        }
    });

    if (factOfType.length == 0) 
        factOfType.push({ "id": NaN, "type": "Error", "content": "No facts of type `" + type + "` found" });
    
    result = factOfType[Math.floor(Math.random() * factOfType.length)]
    
    return result;
}

function getFactsByType(type, amt) {
    amt = amt ?? 1;
    let factOfType = [];
    let result = [];
    factsData.facts.forEach((fact) => {
        if (fact.type == type) {
            factOfType.push(fact)
        }
    });
    
    for (i = 0; i < amt; i++){
        if (factOfType.length == 0) {
            result.push({ "id": NaN, "type": "Error", "content": "No facts of type `" + type + "` found" });
            break;
        }
        rn = Math.floor(Math.random() * factOfType.length);
        result.push(factOfType[rn]);
        factOfType.splice(rn, 1);
    }
    return {"found": result.length, "facts":result}
}

//routes
app.use('/random', limiter, (req, res, next) => {
    res.json(randomFact());
})

app.use('/id/:id', limiter, (req, res, next) => {
    res.json(getFactById(req.params.id));
})

app.use('/type/:type/:amt', limiter, (req, res, next) => {
    res.json(getFactsByType(req.params.type, req.params.amt));
})

app.use('/type/:type', limiter, (req, res, next) => {
    res.json(getFactByType(req.params.type))
})

app.use('/', (req, res, next) => {
    let html = "<html>";
        html += "<head>";
            html += "<title>Fact API</title>";
        html += "</head>";
    
        html += "<body>";
            html += "<h2>You may use following endpoints</h2>";
            html += "<ul>";
                html += "<li><a target='_blank' href='./random' title='random facts'>Random Facts</a><br>Syntax: .../random</li>";
                html += "<hr>";
                html += "<li><a target='_blank' href='./type/general' title='fact by type'>Fact by type</a><br>Syntax: .../type/&lt;fact-type&gt;</li>";
                html += "<hr>";
                html += "<li><a target='_blank' href='./type/general/2' title='facts by type'>Facts by type</a><br>Syntax: .../type/&lt;fact-type&gt;/&lt;number-of-facts&gt;</li>";
                html += "<hr>";
                html += "<li><a target='_blank' href='./id/1' title='facts by type'>Facts by id</a><br>Syntax: .../id/&lt;fact-id&gt;</li>";
            html += "</ul>";
        html += "</body>";
    html += "</html>";

    res.send(html);
    next();
});

//start server
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})