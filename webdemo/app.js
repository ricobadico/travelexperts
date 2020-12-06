const express = require("express");
const path = require("path");
const handlebars = require("express-handlebars");
const mysql = require("mysql");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { randomNum } = require("./static/js/randomNum.js");
const redis = require("redis");
const session = require("express-session");
const uuid = require("uuid");

let RedisStore = require("connect-redis")(session);
let redisClient = redis.createClient();

const app = express();
// In memory cache / data store

//Load Config Environment variables
dotenv.config({ path: "./.env", debug: false });
const PORT = process.env.PORT || 8000;

// Setup Express Middleware ---------------------------------//

app.use(express.urlencoded({ extended: true })); // parse url
if (process.env.NODE_ENV === "development") {
  // log req res in dev
  app.use(morgan("dev"));
}
//  Set handlebars as view engine
app.set("view engine", "handlebars");
app.engine("handlebars", handlebars({ extname: "handlebars" }));
// prettier-ignore
// session to identify unique client session and login auth
app.use( 
  session({
    genid : (req) => {
        return uuid.v4();
    },
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new RedisStore({ client: redisClient})
  })
);
app.use("/", express.static(path.join(__dirname, "static")));

//  HELPERS ---------------------------------//

// prettier-ignore
const getConnection = () => {
    // Open up the database for use. Any express method call can use this 'connection' variable, but needs to connect and end it's particular connection instance! (see existing examples)
    let connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      multipleStatements: true
    });
    return connection;
}

// Start the express server listen for requests and send responses
app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

// ROUTES ---------------------------------//
app.get("/register", (req, res) => {

  // This data gets passed into the template (in this case, for the header)
  const registerInputs = {
    Title: "Register",
    Subtitle: "Register for an account to stay up to date on our hottest deals."
  }

  console.log("render register");
  res.render("register", registerInputs);
});

app.get("/packages", (req, res) => {

  packagesInput = {
    Title: "Our Packages",
    Subtitle: "Find the perfect upcoming trip for you."
  }
  console.log("render packages");
  res.render("packages", packagesInput);
});

app.get("/", (req, res) => {
  //res.writeHead(200, { "Content-Type": "text/html" });
  console.log(req.query);
  console.log("render home");
  // the home page is injected with some values that determine whether the intro happens, and what splash image to show
  res.render("home", { skipIntro: req.query.skipIntro, introSplashNumber : `${randomNum(6)}`});
});

// for testing the login
app.get("/login", (req, res, next) => {
  if (req.session.views) {
    req.session.views++;
    res.setHeader("Content-Type", "text/html");
    res.write("<p>views: " + req.session.views + "</p>");
    res.write("<p>expires in: " + req.session.cookie.maxAge / 1000 + "s</p>");
    console.log(`This sessions unique id: ${req.session.id}`);
    res.end();
  } else {
    req.session.views = 1;
    console.log(`This sessions unique id: ${req.session.id}`);
    res.end("welcome to the session demo. refresh!");
  }
});
// Feisty template render for Contact page, requires nested queries fed into a complicated template
// It works but occasionally fails to pull from the db, I'll work on it
app.get("/contact", (req, res) => {
  let connection = getConnection();
  connection.connect();

  //Start building the array that will contain the data we need, in a form useful to handlebars
  let contactInputs = { Agencies: [] };

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
      contactInputs.Agencies.push(agencies[i]);

      // Add an empty array element for agents (to be filled below)
      contactInputs.Agencies[i].agents = [];
    }

    // Now we iterate through agents and assign them to their proper agencies
    for (let j in agents) {
      homeAgency = agents[j].AgencyId;

      // here, we are adding the current agent to the agency at the index corresponding to their id (which is -1)
      contactInputs.Agencies[homeAgency - 1].agents.push(agents[j]);
    }
    // With the heavy lifting done, we can add any other needed data for the template, in this case the header information
    contactInputs.Title = "Contact Us";
    contactInputs.Subtitle = "Contact one of our international travel agents for inquiries on your next travel destination."
   
    console.log("render contacts");
    // We now have all the data needed to populate the template, in the form the template is expecting
    // prettier-ignore
    res.render("contacts2", contactInputs);
    connection.end();
  });
});

// Insert the Register data into the database. All the Register page form needs to do is have "registerPOST" as its action to fire this off
app.post("/registerPOST", (req, res) => {
  // This is just fancy "javascript destructuring": assigns these variables to the corresponding properties of the req.body object
  let {
    firstName,
    lastName,
    userName,
    pwd,
    email,
    pNumber,
    address,
    city,
    prov,
    pCode,
    sendInfo,
  } = req.body;
  console.log(req.body);
  // Use the defined connection config to connect
  let connection = getConnection();
  connection.connect();

  // Make a query based off of register form data, with placeholders for body entries
  // We'll write the sql as a variable on its own line to break up the code a little.
  //You could instead write it as a string directly as the connection.query first argument
  //Note this query looks like lot - the format really just mean:
  //INSERT A NEW ENTRY INTO [a database table] (data,for,this,list,of,columns) THESE VALUE (one,datum,for,each,column,respectively)
  let sql =
    "INSERT INTO customers (`CustFirstName`, `CustLastName`, `CustEmail`, `CustHomePhone`, `CustAddress`, `CustCity`, `CustProv`, `CustPostal` , `CustBusPhone`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

  // Use a mysql connection's built-in query function to query the database. First argument is the SQL query, second argument defines placeholders ('?') in that query.
  // Third argument is the callback that happens once you've successfully gotten back the data (or an error) from the database
  let result = connection.query(
    sql,
    [firstName, lastName, email, pNumber, address, city, prov, pCode, pNumber],
    function (error, result) {
      if (error) {
        connection.end();
        console.log(error);
        throw Error;
      }

      // We're going to leave a console.log here just so anyone on the server can confirm that something happened
      console.log(result);

      // We've done what we needed and can close the mysql connection!
      connection.end();

      // The user sent a request "/registerPOST" and is expecting a response! You need to tell the response to do something before we finish this express method call.
      // Right now we go to the index page, but a page that acknowledges that they've been registered would be better.
      console.log("returning home after register post");
      res.render("home");
    }
  );
});
