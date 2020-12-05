const express = require("express");
const path = require("path");
const handlebars = require("express-handlebars");
const mysql = require("mysql");
const dotenv = require("dotenv");

//Load Config
dotenv.config({ path: "./.env", debug: true });

const app = express();
const PORT = process.env.PORT || 8000;
//const PORT = 8000;

//  Set handlebars as view engine
app.set("view engine", "handlebars");
// Handlebars needs this engine line to configure it and work properly
// prettier-ignore
app.engine("handlebars", handlebars({extname: "handlebars"}));

// Set up serving of static files
//app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/", express.static(path.join(__dirname, "static")));
/*
app.use(
  "/",
  express.static(path.join(__dirname, "static"), {
    extensions: ["html", "htm", "css", "js"],
  })
);

app.use(
  "/",
  express.static(path.join(__dirname, "static/media"), {
    extensions: ["jpg", "png", "svg"],
  })
);
*/
app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

// Serves up index.html on the root
app.get("/index", (req, res) => {
  res.sendFile(__dirname + "/static/index.html");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/packages", (req, res) => {
  res.sendFile(__dirname + "/static/packages.html");
});
app.get("/", (req, res) => {
  res.render("home");
});

// Feisty template render for Contact page, requires nested queries fed into a complicated template
// It works but occasionally fails to pull from the db, I'll work on it
app.get("/contact", (req, res) => {
  // prettier-ignore
  // Open up the database for use.
  const connection = mysql.createConnection({
    host: process.env.HOST,
    user: "root",
    password: "password",
    database: "travelexperts",
    multipleStatements: true,
    insecureAuth: true
  });

  connection.connect();

  //Start building the array that will contain the data we need, in a form useful to handlebars
  let dynamicAgencyList = { Agencies: [] };

  // Query 1 : get the data. results[0] is the array of agencies, results[1] the array of agents
  connection.query("SELECT * FROM agencies; SELECT * from agents", function (
    error,
    results
  ) {
    if (error) {
      console.log(error);
    } //throw new Error("Failed to load agency table from database");
    const agencies = results[0];
    const agents = results[1];

    // For each agency pulled up in that query, we've got some work to do
    for (let i in agencies) {
      // Add that agency as an entry to the agency array
      dynamicAgencyList.Agencies.push(agencies[i]);

      // Add an empty array element for agents (to be filled below)
      dynamicAgencyList.Agencies[i].agents = [];
    }

    // Now we iterate through agents and assign them to their proper agencies
    for (let j in agents) {
      homeAgency = agents[j].AgencyId;

      // here, we are adding the current agent to the agency at the index corresponding to their id (which is -1)
      dynamicAgencyList.Agencies[homeAgency - 1].agents.push(agents[j]);
    }
    //console.log(agents);

    // We now have all the data needed to populate the template, in the form the template is expecting
    // prettier-ignore
    res.render(path.join(__dirname, "/views/contacts2.handlebars"), dynamicAgencyList);
    connection.end();
  });
});
