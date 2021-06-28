const express = require('express');
const cors = require('cors');
const factsData = require('./crs-pltf/facts.json')
const app = express();
const PORT = process.env.PORT ?? 5000;

//initial setup
app.use(cors())

//handling functions
function randomFact() {
    i = Math.floor(Math.random() * factsData.total);
    fact = factsData.facts[i];
    return fact;
}

function getFactById(id) {
    let factGot = {
        id: NaN,
        type: "unknown",
        content: "Invalid id"
    };
    factsData.facts.forEach((fact) => {
        if (fact.id == id) factGot = fact;
    })
    return factGot;
}

//routes
app.use('/id/:id', (req, res, next) => {
    res.json(getFactById(req.params.id));
    next();
})

app.use('/random', (req, res, next) => {
    res.json(randomFact());
    next();
})

app.use('/', (req, res, next) => {
    res.sendFile('./index.html', { root: __dirname });
});

//start server
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})