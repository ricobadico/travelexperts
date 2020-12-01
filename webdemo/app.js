
const express = require("express");
const path = require("path");
const handlebars = require("express-handlebars");
const mysql = require("mysql");

const app = express();
const PORT = 8000;

//  Set handlebars as view engine
app.set('view engine', 'handlebars');
// Handlebars needs this engine line to configure it and work properly
app.engine('handlebars', handlebars({
    extname: "handlebars",
    defaultLayout: "",
}));

// Open up the database for use.
// Set up as a pool - if you use it, you don't need to call connection.connect(). 
// You do still need to call connection.end() after use;
const connection = mysql.createPool({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'travelexperts',
    connectionLimit: 100
});

// Set up serving of static files
// app.use("/static", express.static(path.join(__dirname, "static")));
app.use(express.static("static", {extensions: ["html", "htm", "css", "js"]}));
app.use(express.static("static/media", {extensions: ["jpg", "png", "svg"]}));

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});

// Serves up index.html on the root
app.get("/", (req, res)=>{
    res.sendFile(__dirname +"/static/index.html");
});

// Fiesty template render for Contact page, requires nested queries fed into a complicated template
app.get("/contacto", (req,res) => {

    //Start building the array that will contain the data we need, in a form useful to handlebars
    let dynamicAgencyList = { Agencies: []};

    // Query 1 : get the agencies
    connection.query('SELECT * FROM agencies', async function (error, agencies) {
        if (error) throw new Error ("Failed to load agency table from database");
  
        // For each agency pulled up in that query, we've got some work to do
        for(let i = 0; i < agencies.length; i++){ 

            // Add that agency as an entry to the agency array
            dynamicAgencyList.Agencies.push(agencies[i]);

            // Add an empty array element for agents (to be filled below)
            dynamicAgencyList.Agencies[i].agents= [];

            // Query 2: want to get agents from within each agency (one agency at a time)
            // We call the query (see getResult) and await its response - otherwise, the code will continue before the query finishes
            agents = await getResult('SELECT * FROM agents WHERE AgencyId = ?', i+1 ) // we add 1 since agencies index starts at 0, but agencyid starts at 1
            .catch(err => console.error(err));
        
            // Then, add the resulting agents to the current agency
            dynamicAgencyList.Agencies[i].agents = agents;
        }

        // We now have all the data needed to populate the template, in the form the template is expecting
        res.render(__dirname + '/views/contact.handlebars', dynamicAgencyList);
        connection.end();
    }); 
});

// This helper function makes an sql query as a Promise - a value that changes based on whether the result succeeded, failed, or
// hasn't yet completed. Importantly, we can call this inside an async function above and wait for the result before continuing.
function getResult(sql, placeholder){
    return new Promise(function(resolve,reject){
      connection.query(sql, placeholder, function(err, result){
        if(err){
          reject(new Error ("Failed to connect to agents table of database"));
        }else{
          resolve(result)
        }
      });
    })
  }


