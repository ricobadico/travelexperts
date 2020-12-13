// Initial server script created by [Susan], with lots of input from [everyone]. 
// High credit for [Bob] who managed the inclusion and implementation of most additional modules:
// especially express-session, bcrypt, redis, morgan for dev.
// Routes are credited inline.

const express = require("express");
const mysql = require("mysql");
const path = require("path");
const handlebars = require("express-handlebars");
const getConnection = require("./models/db.js"); // module for getting a connection instance [Bob]
//const auth = require("./modules/auth.js"); //bycrypt testing module not used see auth.js [Bob]
//const morgan = require("morgan"); //used for testing, i removed the middleware so not needed [Bob]
const dotenv = require("dotenv");
const { randomNum } = require("./static/js/randomNum.js"); //[Eric] Animation Photos
const redis = require("redis");
const session = require("express-session");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const { connected } = require("process");
const saltRounds = 10;
const { formatDate } = require("./static/js/formatDate.js");

// Define a user session stored through redis module (needed for login) [Bob]
// **IMPORTANT**: please note the computer running the server requires
// an installation of Redis for the code to function.
// Downloading the .msi here will suffice: ****** https://github.com/microsoftarchive/redis/releases/tag/win-3.0.504 *****
const RedisStore = require("connect-redis")(session);
const redisClient = redis.createClient();

// a few globals, these next 3 were for testing and could be factored out
let user_id;
let user_email;
let recentSessions = {};
// only this one is truely required and set per request with Session
let loggedIn = false;

// [Bob] was the start of a User model but not really used
// Once Session was working we use it as we don't use an ORM
// I have some code that sets it up and I don't have time to factor it out
function User(id, firstName, lastName, email) {
    (this.userid = id),
    (this.firstName = firstName),
    (this.lastName = lastName),
    (this.email = email)
}

const app = express();

//  Set handlebars as view engine
// [Bob][Susan] did the main conversion and starter templates
// [Everyone] converted their static html and route call from there
app.set("view engine", "handlebars");
app.engine("handlebars", handlebars({ extname: "handlebars" }));

//Load Config Environment variables
//[Bob]Having your environment vars outside you code is common best practice
dotenv.config({ path: "./.env", debug: false });
const PORT = process.env.PORT || 8000; 

// Setup Express Middleware ---------------------------------//
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parse url

// [bob] please uncomment if using morgon, NODE_ENV is set with cross-env module in the start script package.json
//if (process.env.NODE_ENV === "development") {
//  app.use(morgan("dev"));
//}

// session to identify unique client session and login auth [Bob]
// can remember you are loggin in after closing upto a timelimit
// needed for multiple connections from different users
app.use( 
  session({
    genid : (req) => {
        console.log(`In Session middleware sessionId: ${req.sessionID}`);
        return uuid.v4();
    },
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 600000,
        secure: false
    },
    store: new RedisStore({ client: redisClient}),
  })
);

// Serve files in static folder statically
app.use("/", express.static(path.join(__dirname, "static")));

// Manages the state change for Logged in and out [Bob]
// This is run every request and sets the gobal state of logginIn in-sync with the session
app.use((req, res, next) => {
  if (req.session.uid) {
    loggedIn = true;
    req.session.login = true;
  } else {
    loggedIn = false;
    req.session.login = false;
    req.session.uid = null;
  }
  console.dir(req.session);
  next();
});

// Middleware ------------------------------//

// error handler
app.use((err, req, res, next) => {
  res.status(400).send(err.message);
});

// ROUTES ---------------------------------//

// Home render -- base [Susan], [Eric] adding custom intro tie-in, [Bob] connecting to login  
app.get("/", (req, res) => {
  if (recentSessions) {
    console.dir(recentSessions);
  }
  console.log("render home");
  // the home page is injected with some values that determine whether the intro happens, and what splash image to show
  homeInputs = {
    skipIntro: req.query.skipIntro,
    introSplashNumber: `${randomNum(6)}`,
  };

  homeInputs.loggedIn = loggedIn;
  res.render("home", homeInputs);
});


// Logout route - [Bob]
app.post("/logout", (req, res, next) => {
  req.session.uid = null;
  loggedIn = false;

  homeInputs = {
    skipIntro: req.query.skipIntro,
    introSplashNumber: `${randomNum(6)}`,
  };

  homeInputs.skipIntro = true;
  homeInputs.loggedIn = loggedIn;
  res.render("home", homeInputs);
});


//  Login route - [Bob]
app.post("/login", (req, res, next) => {
  let connection = getConnection();
  connection.connect();
  let dbResult;
  let results;

  let sql = "SELECT * FROM ?? WHERE ?? = ?";
  let inserts = ["web_credentials", "Username", req.body.username];
  sql = mysql.format(sql, inserts);
  connection.query(sql, async (err, results) => {
    if (err) {
      console.error(err);
      connection.end();
      // do some redirect ********************TODO************
    } else {
      //console.log(results);
      dbResult = results;
      //console.log(req.body.password);
      await bcrypt.compare(
        req.body.password,
        results[0].Hash,
        async (err, result) => {
          if (err) {
            console.error(err);
            connection.end();
          } else if (result) {
            //true
            console.log("passwords match");
          } else {
            // false
            console.log("password do not match");
            //do some redirect
            //***************************TODO********************//
          }
        }
      );
      console.dir(req.session);
      if (dbResult) {
        req.session.uid = dbResult[0].CustomerId;
        req.session.save();
      }
      connection.end();
    }
    res.redirect("/?skipIntro=true");
  });
});


// Error routes [Bob]
app.get("/error", (req, res) => {
  res.render("error", { httpcode: res.status, message: "Error Message" });
});

app.post("/error", (req, res) => {
  res.render("error", { httpcode: res.status, message: "Error Message" });
});


// Register page render - base [Susan], login templating setup [Bob]
app.get("/register", (req, res) => {

  // This data gets passed into the template (in this case, for the header)
  const registerInputs = {
    Title: "Register",
    Subtitle:
      "Register for an account to stay up to date on our hottest deals.",
  };
  registerInputs.loggedIn = loggedIn;

  console.log("render register");
  res.render("register", registerInputs);
});


// Packages page render - dynamic pull from db [Eric], date formatting [Sheyi, Susan, Eric]
app.get("/packages", (req, res) => {
  // Set up data to be passed into template
  packagesInput = {
    Title: "Our Packages",
    Subtitle: "Find the perfect upcoming trip for you.",
  };

  // Connect to db
  let connection = getConnection();
  connection.connect();

  // Query to grab package data from db -- added date conditional and ordering [Eric]
  connection.query("SELECT * FROM packages WHERE PkgStartDate > ? ORDER BY PkgStartDate", new Date(), (err, result) => {

    if (err) console.log(err);

    // Adding login data to template object [Bob]
    packagesInput.loggedIn = loggedIn;

    // This line adds an array of package data objects to the template input object - already arranged in such a way as to be used by handlebars 
    packagesInput.Packages = result;

    // Iterates over each package in packageInput.packges and applies a date formatting function to that data [Eric, Susan, Sheyi]
    for (let currentPackageIndex in packagesInput.Packages) {
      packagesInput.Packages[currentPackageIndex].PkgStartDate = formatDate(
        packagesInput.Packages[currentPackageIndex].PkgStartDate
      );
      packagesInput.Packages[currentPackageIndex].PkgEndDate = formatDate(
        packagesInput.Packages[currentPackageIndex].PkgEndDate
      );
    }

    // Log data passed into packagesInput (for clarity server-side), then render it
    console.log(packagesInput);
    console.log("render packages");
    res.render("packages", packagesInput);
    connection.end();
  });
});


// Orders Page render (accessible by clicking an order button for one package on Packages page) - [Sheyi] w/ [Eric] Assist
app.post("/orders", (req, res) => {
 
  // Use formatDate module to create a new date with human-friendly formatting [Sheyi]
  date = formatDate(new Date());

  // Setup data object for handlebars render
  const ordersInput = {
    Title: "Your Order",
    Subtitle: "Finish your planning ",
    date: `${date}`,
  };

  // Connect to db
  let connection = getConnection();
  connection.connect();

  // Run query to just get package data from the package clicked on last page (packageID sent in request)
  connection.query(
    "SELECT * FROM packages where PackageId = ?", req.body.packageId, (err, result) => {
      if (err) console.log(err);

      // Grab all the relevant data from the resulting query and add it to the tamplate data object [Sheyi] w/ [Eric] assist
      ordersInput.PkgName = result[0].PkgName;
      ordersInput.PkgBasePrice = result[0].PkgBasePrice;
      ordersInput.PkgDesc = result[0].PkgDesc;
      ordersInput.PkgStartDate = result[0].PkgStartDate;
      ordersInput.PkgEndDate = result[0].PkgEndDate;
      ordersInput.PackageId = req.body.packageId;

      console.log(ordersInput);
      console.log("render orders");

      //  Add login details - [Bob]
      ordersInput.loggedIn = loggedIn;
      if (req.session.uid) {
        ordersInput.uid = req.session.uid;
      } else {
        ordersInput.uid = "";
      }
      res.render("orders", ordersInput);
      connection.end();
    }
  );
});

// Order post to database and then Thank You Render (from clicking order button on Order page) - [Susan] w/ [Eric] Assist
app.post("/orderPOST", (req, res) => {

  // Connect to db
  let connection = getConnection();
  connection.connect();

  // Depending on whether the user is logged in or not, we may need to run an extra query
  // We can determine this because CustomerId is *only* passed in the req if logged in
  // If logged in, we go straight to inserting the bookings
  if (req.body.CustomerId) {

    // There's a lot going on in this insertBookings function - two database inserts are made. 
    // This was abstracted into a function to make this route more readable
    insertBookings(connection, req, res, null);

    // Otherwise, we need to insert into the customer table first
  } else {
    console.log("Request Body below:")
    console.log(req.body);

    // Grab customer info from form data sent through request
    let CustFN = req.body.firstName;
    let CustLN = req.body.lastName;
    let CustEM = req.body.email;
    let CustPH = req.body.pNumber;
    let CustAD = req.body.address;
    let CustCY = req.body.city;
    let CustPV = req.body.prov;
    let CustPC = req.body.pCode;

    // IMPORTANT NOTE: Travel Experts DB currently treats Customer Business Phone as required and home phone as optional. That seems incorrect for individual customers.
    // For the prototype, we are fixing this by inserting the customer's inputted phone number into both fields.
    // However, if we were able to consult with Travel Experts, we would suggest to change CustHomePhone to required and set CustBusPhone as optional. 
    let sql1 =
      "INSERT INTO customers (`CustFirstName`, `CustLastName`, `CustEmail`, `CustHomePhone`, `CustBusPhone`, `CustAddress`, `CustCity`, `CustProv`, `CustPostal`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    let inserts1 = [CustFN, CustLN, CustEM, CustPH, CustPH, CustAD, CustCY, CustPV, CustPC];
    sql1 = mysql.format(sql1, inserts1);
    console.log(sql1);

    // Do insert query to add customer entry
    connection.query(sql1, (err, result) => {
      if (err) console.log(err);

      // We log the insert result just to allow following along in the server
      console.log(result);

      // Now that we have a new customer inserting (and can access the insertID through result, we run the large insertBookings function)
      insertBookings(connection, req, res, result);
    });
  }
});


// Contact page render, using data from db - [Eric] 
app.get("/contact", (req, res) => {

  // Connect to db
  let connection = getConnection();
  connection.connect();

  //Start building the array that will contain the data we need, in a form useful to handlebars
  let contactInputs = { Agencies: [] };

  // Query 1 : get the data. results[0] is the array of agencies, results[1] the array of agents
  connection.query("SELECT * FROM agencies; SELECT * from agents", function (error, results) {
    if (error) console.log(error);

    // Assign each query result to a variable
    console.log(results);
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
    contactInputs.Subtitle = "Contact one of our international travel agents for inquiries on your next travel destination.";

    // We now have all the data needed to populate the template, in the form the template is expecting
    console.log("render contacts");
    contactInputs.loggedIn = loggedIn;
    console.dir(contactInputs);

    // Finally render
    res.render("contacts", contactInputs);
    connection.end();
  });
});


// Register data inserted into the database from Register page form, rendering Thank you page
// db insert and routing by [Eric], login integration and await refactoring by [Bob], rendering to Thank You page by [Susan]
app.post("/registerPOST", (req, res) => {
  // This is just fancy "javascript destructuring": assigns these variables to the corresponding properties of the req.body object
  let {firstName, lastName, userName, pwd, email, pNumber, address, city, prov, pCode, sendInfo} = req.body;

  // Use the defined connection config to connect
  let connection = getConnection();
  connection.connect();

  // Make a query based off of register form data, with placeholders for body entries
  // We'll write the sql as a variable on its own line to break up the code a little.
  //You could instead write it as a string directly as the connection.query first argument
  //Note this query looks like a lot - the format really just mean:
  //INSERT A NEW ENTRY INTO [a database table] (data,for,this,list,of,columns) THESE VALUE (one,datum,for,each,column,respectively)
  let sql = "INSERT INTO customers (`CustFirstName`, `CustLastName`, `CustEmail`, `CustHomePhone`, `CustBusPhone`, `CustAddress`, `CustCity`, `CustProv`, `CustPostal`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  let inserts = [firstName, lastName, email, pNumber, pNumber, address, city, prov, pCode];
  sql = mysql.format(sql, inserts);
  console.log(sql);

  // Use a mysql connection's built-in query function to query the database. First argument is the SQL query, second argument
  // is the callback that happens once you've successfully gotten back the data (or an error) from the database
  let recordId;
  connection.query(sql, async (err, result) => {
    if (err) {
      //await connection.end();
      connection.end();
      console.error(err);
      throw Error;
    }
    // We're going to leave a console.log here just so anyone on the server can confirm that something happened
    console.log(result);

    // Create new user from customer entry [Bob]
    // this was for making a user model later and tracking Sessions for testing
    recordId = result.insertId;
    let user = new User(recordId, firstName, lastName, email);
    recentSessions[req.session.id] = user;
    //console.log(result.insertId);

    //await connection.end();
    connection.end();
    // if the customer was inserted we take that record and
    // use it insert and save the salted password hash to the db.
    await bcrypt.hash(pwd, saltRounds, async (err, hash) => {
      // Store hash in your password DB.
      if (err) {
        console.error(err);
        console.log("unable to hash new password!");
      } else {
        console.log(`hash: ${hash}`);
        //console.log(hash);
        // Open a new connection and attempt the query
        let connection2 = getConnection();
        connection2.connect();
        sql =
          "INSERT INTO `web_credentials` (`CustomerId`, `Username`, `Hash`) VALUES (?,?,?)";
        inserts = [recordId, userName, hash];
        sql = mysql.format(sql, inserts);
        connection2.query(sql, async (err, result) => {
          if (err) {
            connection2.end();
            console.error(err);
          } else {
            console.log(`Insert success: ${sql}`);
            console.log(`Row Id = ${recordId}`);
            req.session.uid = recordId;
            req.session.email = email;
            console.log(`Store req.session.email = ${req.session.email}`);
            //await req.session.save();
            //await connection2.end();
            req.session.save();
            connection2.end();
          }
        });
      }

      console.log(bcrypt.compareSync(pwd, hash));
    });
  });

  user_id = recordId; //for testing
  user_email = email; //for testing
  console.dir(recentSessions);

  // define registration thank you page variables which includes customer first name [Susan]
  const rThanksHeader = {
    Title: "Success!",
    Subtitle: "Your registration was successful",
    CustFirstName: req.body.firstName,
  };
  console.log("returning thank you page after register post");
  console.log(req.body.firstName);

  // add login info to template data object [Bob]
  rThanksHeader.loggedIn = loggedIn;

  // render registration thank you page
  res.render("registerThanks", rThanksHeader);
});


// for testing the login [Bob]
app.get("/sessionTest", (req, res, next) => {
  if (req.session.views) {
    req.session.views++;
    console.dir(recentSessions);
    console.log(`logged in: ${loggedIn}`);

    console.log(`user_id: ${user_id}`);
    console.log(`user_email: ${user_email}`);
    console.log(`Logged in ${loggedIn}`);
    console.log("-----------test---------------");
    res.setHeader("Content-Type", "text/html");
    res.write("<p>views: " + req.session.views + "</p>");
    res.write("<p>expires in: " + req.session.cookie.maxAge / 1000 + "s</p>");
    res.write("<p>user email is " + req.session.email + "</p>");
    console.log(`This sessions unique id: ${req.session.id}`);

    res.write("<p>user: " + req.session.uuid + "</p>");
    let now = Date(Date.now());
    res.write("<p>Now: " + now.toString() + "</p>");
    console.dir(recentSessions[req.session.id]);
    console.dir(req.session);
    console.dir(session);
    console.log("-----end------test---------------");

    res.end();
  } else {
    if (req.session.uid) {
      //console.log(`user_id: ${req.session.uid}`);
    }
    req.session.views = 1;
    console.log(`This sessions unique id: ${req.session.id}`);
    res.end("welcome to the session demo. refresh!");
  }
});


// Start the express server listen for requests and send responses
app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

// Helper function to insert bookings, cleans up code in /ordersPOST route -- [Eric], connection to Thank you page [Susan]
function insertBookings(connection, req, res, result) {
  //STEP 1 -----
  // Get all data needed to fill in a row of the bookings table in db
  // That includes BookingDate, BookingNo(?), TravelerCount, CustomerID, TripTypeId(?), PackageId
  // Some of those values we aren't getting from anywhere (marked with a ?), let's leave them null
  // Luckily, the rest we can get from req.body from the previous page
  let BookingDate = new Date();
  let TravelerCount = req.body.TravelerCount;
  let CustomerId;
  if (req.body.CustomerId) {
    CustomerId = req.body.CustomerId;
  } else {
    CustomerId = result.insertId;
  }
  let PackageId = req.body.PackageId;

  // Then, do an INSERT INTO bookings query
  // You need an SQL query first
  let sql =
    "INSERT INTO bookings (`BookingDate`, `TravelerCount`, `CustomerID`, `PackageId`) VALUES (?, ?, ?, ?)";
  // Next, create an array of values to insert in the placeholders (the values getting inserted into the database in their respective columns)
  let inserts = [BookingDate, TravelerCount, CustomerId, PackageId];
  // This next line updates the sql to insert those placeholders in a tidy, attack-secure way (don't worry about it too much)
  sql = mysql.format(sql, inserts);
  console.log(sql);
  // Finally the query
  connection.query(sql, (err, result) => {
    if (err) console.log(err);

    //In the event of a successful insert, we can grab the newly inserted row's id out of the result object. We'll need it in the next insert query
    console.log(result);
    let BookingId = result.insertId;

    //STEP 2 -----------
    // Get all data needed to fill in a row of bookingdetails table in db
    // That includes ItineraryNo(?), TripStart, TripEnd, Description, Destination(?), BasePrice, AgencyCommission(?), BookingId, RegionId(?), ClassId(?), FeeId(?), ProductSupplierId(?)
    // Note we need BookingId which means we have to insert into the bookings table above first, then grab the id from the result
    // The form will be fairly similar to the step 1 above. Note some values come from the package table (they aren't 3NF!) and we could do another query to get them...
    // However, what we've done instead is send that info as hidden form data from /packages route to /orders to /packagesPOST, pulling them out of req.body
    let TripStart = req.body.PkgStartDate;
    let TripEnd = req.body.PkgEndDate;
    let Description = req.body.PkgDesc;
    let BasePrice = req.body.OrderTotalCost;
    //Note BookingId is already defined above

    // Then, do an INSERT INTO bookingdetails query
    let sql =
      "INSERT INTO bookingdetails (`TripStart`, `TripEnd`, `Description`, `BasePrice`, `BookingId`) VALUES (?, ?, ?, ?, ?)";
    let inserts = [TripStart, TripEnd, Description, BasePrice, BookingId];
    console.log(sql);
    sql = mysql.format(sql, inserts);

    connection.query(sql, (err, result) => {
      if (err) console.log(err);

      console.log(result);
      connection.end();

      // define orders thank you page variables [Susan]
      const oThanksHeader = {
        Title: "Success!",
        Subtitle: "Your purchase is processing",
      };
      console.log("returning thank you page after orders post");
      oThanksHeader.loggedIn = loggedIn;
      // render registration thank you page
      res.render("ordersThanks", oThanksHeader);
    });
  });
}

