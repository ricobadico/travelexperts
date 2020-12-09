const express = require("express");
const mysql = require("mysql");
const path = require("path");
const handlebars = require("express-handlebars");
const getConnection = require("./models/db.js");
const auth = require("./modules/auth.js");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { randomNum } = require("./static/js/randomNum.js");
const redis = require("redis");
const session = require("express-session");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const { connected } = require("process");
const saltRounds = 10;

const RedisStore = require("connect-redis")(session);
const redisClient = redis.createClient();
let user_id;
let user_email;
let recentSessions = {};
let loggedIn = false;
let navbarPublic = true;
let navbarAuth = false;

//prettier-ignore
function User(id, firstName, lastName, email) {
    (this.userid = id),
    (this.firstName = firstName),
    (this.lastName = lastName),
    (this.email = email)
}

const app = express();

//  Set handlebars as view engine
app.set("view engine", "handlebars");
app.engine("handlebars", handlebars({ extname: "handlebars" }));

//Load Config Environment variables
dotenv.config({ path: "./.env", debug: false });
const PORT = process.env.PORT || 8000;

// Setup Express Middleware ---------------------------------//
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parse url
if (process.env.NODE_ENV === "dev") {
  // log req res in dev
  app.use(morgan("dev"));
}
// prettier-ignore
// session to identify unique client session and login auth
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

app.use("/", express.static(path.join(__dirname, "static")));

app.use((req, res, next) => {
  if (req.session.uid) {
    console.log("Has id");
    console.log(req.session.uid);
    loggedIn = true;
    req.session.login = true;
  } else {
    console.log("no id");
    console.log(req.session.uid);
    loggedIn = false;
    req.session.login = false;
    req.session.uid = null;
  }
  (() => {
    console.log("do i run");
    if (loggedIn) {
      navbarAuth = true;
      navbarPublic = false;
    } else {
      navbarPublic = true;
      navbarAuth = false;
    }
  })();
  next();
});

// Middleware ------------------------------//

// error handler
app.use((err, req, res, next) => {
  res.status(400).send(err.message);
});

// ROUTES ---------------------------------//
app.get("/register", (req, res) => {
  // This data gets passed into the template (in this case, for the header)
  const registerInputs = {
    Title: "Register",
    Subtitle:
      "Register for an account to stay up to date on our hottest deals.",
  };

  console.log("render register");
  res.render("register", registerInputs);
});

app.get("/packages", (req, res) => {
  packagesInput = {
    Title: "Our Packages",
    Subtitle: "Find the perfect upcoming trip for you.",
  };
  let connection = getConnection();
  connection.connect();
  // TODO: Need to change this to only find packages in the future. This means we need to change dates in the db
  connection.query("SELECT * FROM packages", (err, result) => {
    if (err) console.log(err);

    packagesInput.Packages = result;

    console.log(packagesInput);
    console.log("render packages");
    res.render("packages", packagesInput);
    connection.end();
  });
});

// Orders Page - [Sheyi w/ Eric Assist]
app.post("/orders", (req, res) => {
  function formatDate(date) {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }
  date = formatDate(new Date());

  const ordersInput = {
    Title: "Your Order",
    Subtitle: "Finish your planning ",
    date: `${date}`,
  };
  let connection = getConnection();
  connection.connect();
  connection.query(
    "SELECT * FROM packages where PackageId = ?",
    req.body.packageId,
    (err, result) => {
      if (err) console.log(err);
      ordersInput.PkgName = result[0].PkgName;
      ordersInput.PkgBasePrice = result[0].PkgBasePrice;
      ordersInput.PkgDesc = result[0].PkgDesc;
      ordersInput.PkgStartDate = result[0].PkgStartDate;
      ordersInput.PkgEndDate = result[0].PkgEndDate;
      console.log(ordersInput);
      console.log("render orders");
      res.render("orders", ordersInput);
      //   packagesInput.Packages = result;

      //   console.log(packagesInput);
      //   console.log("render packages");
      //   res.render("packages", packagesInput);
      connection.end();
    }
  );
});

// Orders Page Submit --> submits order confirmation, updating relevant db tables, go to thank you page [Eric]
app.post("/orderPOST", (req, res) => {
  // First, we need to open a database connection:
  let connection = getConnection();
  connection.connect();
  connection.query(
    "SELECT * FROM packages where PackageId = ?",
    req.body.packageId,
    (err, result) => {
      if (err) console.log(err);
      ordersInput.PkgName = result[0].PkgName;
      ordersInput.PkgBasePrice = result[0].PkgBasePrice;
      ordersInput.PkgDesc = result[0].PkgDesc;
      console.log(ordersInput);
      console.log("render orders");
      res.render("orders", ordersInput);
      connection.end();
    }
  );
});

// ordersPOST renders thank you page after posting to database
app.post("/orderPOST", (req, res) => {
  // define orders thank you page variables
  const oThanksHeader = {
    Title: "Success!",
    Subtitle: "Your purchase is processing",
  };
  console.log("returning thank you page after orders post");
  // render registration thank you page
  res.render("ordersThanks", oThanksHeader);

  //STEP 1 -----
  // TODO: Get all data needed to fill in a row of the bookings table in db
  // That includes BookingDate, BookingNo(?), TravelerCount, CustomerID, TripTypeId(?), PackageId
  // Some of those values we aren't getting from anywhere (marked with a ?), let's leave them null
  // Luckily, the rest we can get from req.body from the previous page
  let BookingDate = new Date();
  let TravelerCount = req.body.TravelerCount;
  let CustomerId = req.body.CustomerId;
  let PackageId = req.body.packageId;

  // Then, do an INSERT INTO bookings query
  // You need an SQL query first
  let sql =
    "INSERT INTO bookings (`BookingDate`, `TravelerCount`, `CustomerID`, `PackageId`) VALUES (?, ?, ?, ?)";
  // Next, create an array of values to insert in the placeholders (the values getting inserted into the database in their respective columns)
  let inserts = [BookingDate, TravelerCount, CustomerId, PackageId];
  // This next line updates the sql to insert those placeholders in a tidy, attack-secure way (don't worry about it too much)
  sql = mysql.format(sql, inserts);
  // Finally the query
  connection.query(sql, (err, result) => {
    if (err) console.log(err);

    //In the event of a successful insert, we can grab the newly inserted row's id out of the result object. We'll need it in the next insert query
    let BookingId = result.insertId;

    //STEP 2 -----------
    // TODO Get all data needed to fill in a row of bookingdetails table in db
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
    sql = mysql.format(sql, inserts);

    connection.query(sql, (err, result) => {
      if (err) console.log(err);

      console.log(result);
      connection.end();

      // TODO Need to insert render of thank you - I think maybe susan is on this
    });
  });
});

app.post("/logout", (req, res, next) => {
  req.session.uid = null;
  //this will be post route of `/`
  res.render("home");
});

app.get("/", (req, res) => {
  if (recentSessions) {
    console.dir(recentSessions);
  }
  //res.writeHead(200, { "Content-Type": "text/html" });
  //console.log(req.query);
  console.log("render home");
  // the home page is injected with some values that determine whether the intro happens, and what splash image to show
  res.render("home", {
    skipIntro: req.query.skipIntro,
    introSplashNumber: `${randomNum(6)}`,
  });
});
//for logout
app.post("/", (req, res) => {
  if (recentSessions) {
    console.dir(recentSessions);
  }
  //res.writeHead(200, { "Content-Type": "text/html" });
  //console.log(req.query);
  console.log("render home");
  // the home page is injected with some values that determine whether the intro happens, and what splash image to show
  res.render("home", {
    skipIntro: req.query.skipIntro,
    introSplashNumber: `${randomNum(6)}`,
  });
});

app.post("/login", (req, res, next) => {
  session.Des;
  let connection = getConnection();
  connection.connect();
  let dbResult;
  let resultId;

  let message = "";
  let sql = "SELECT * FROM ?? WHERE ?? = ?";
  let inserts = ["web_credentials", "Username", req.body.username];
  sql = mysql.format(sql, inserts);
  connection.query(sql, async (err, results) => {
    if (err) {
      console.error(err);
      await connection.end();
      // should redirect to error page
    } else {
      console.log(results);
      dbResult = results;
      console.log(req.body.password);
      await bcrypt.compare(
        req.body.password,
        results[0].Hash,
        async (err, result) => {
          if (err) {
            console.error(err);
            // do some redirect
            connection.end();
          } else if (result) {
            //true
            message = "passwords match";
            console.log(message);
          } else {
            // false
            console.log(result);
            message = "password do not match";
            console.log(message);
            //do some redirect
          }
        }
      );
      console.log("in login conn dbResult");
      console.dir(dbResult);
      console.log(`id: ${dbResult[0].CustomerId}`);
      console.dir(req.session);
      if (dbResult) {
        req.session.uid = dbResult[0].CustomerId;
        await req.session.save();
      }
      await connection.end();
    }
  });
  // so the problem is that the code in queries excutes after below and after the req.end()
  req.session.email = "testString2";
  res.setHeader("Content-Type", "text/html");
  res.write("<p>Post Query OK</p>");
  res.write(`<p>${message}</p>`);
  res.end();
});

app.get("/error", (req, res) => {
  res.render("error", { httpcode: res.status, message: "Error Message" });
});

app.post("/error", (req, res) => {
  res.render("error", { httpcode: res.status, message: "Error Message" });
});

// Feisty template render for Contact page, requires nested queries fed into a complicated template
// It works but occasionally fails to pull from the db, I'll work on it
app.get("/contact", (req, res) => {
  let connection = getConnection();
  connection.connect();

  //Start building the array that will contain the data we need, in a form useful to handlebars
  let contactInputs = { Agencies: [] };

  // Query 1 : get the data. results[0] is the array of agencies, results[1] the array of agents
  // prettier-ignore
  connection.query("SELECT * FROM agencies; SELECT * from agents", function (error, results) {
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
    contactInputs.Subtitle =
      "Contact one of our international travel agents for inquiries on your next travel destination.";

    console.log("render contacts");
    // We now have all the data needed to populate the template, in the form the template is expecting
    // prettier-ignore
      contactInputs.loggedIn = loggedIn;
      contactInputs.navbarAuth = navbarAuth;
      contactInputs.navbarPublic = navbarPublic;
      console.dir(contactInputs);
    res.render("contacts2", contactInputs);
    connection.end();
  });
});

// Insert the Register data into the database. All the Register page form needs to do is have "registerPOST" as its action to fire this off
app.post("/registerPOST", (req, res) => {
  // This is just fancy "javascript destructuring": assigns these variables to the corresponding properties of the req.body object
  // prettier-ignore
  let {firstName, lastName, userName, pwd, email, pNumber, address, city, prov, pCode, sendInfo} = req.body;
  //console.log(req.body);
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
  //prettier-ignore
  let inserts = [firstName, lastName, email, pNumber, address, city, prov, pCode, pNumber];
  sql = mysql.format(sql, inserts);
  console.log(sql);

  // Use a mysql connection's built-in query function to query the database. First argument is the SQL query, second argument defines placeholders ('?') in that query.
  // Third argument is the callback that happens once you've successfully gotten back the data (or an error) from the database
  let recordId;
  connection.query(sql, async (err, result) => {
    if (err) {
      await connection.end();
      console.error(err);
      throw Error;
    }
    // We're going to leave a console.log here just so anyone on the server can confirm that something happened
    recordId = result.insertId;
    let user = new User(recordId, firstName, lastName, email);
    recentSessions[req.session.id] = user;
    //console.log(result.insertId);

    await connection.end();
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
            await req.session.save();
            await connection2.end();
          }
        });
      }

      console.log(bcrypt.compareSync(pwd, hash));
    });

    // We've done what we needed and can close the mysql connection!
    // The user sent a request "/registerPOST" and is expecting a response! You need to tell the response to do something before we finish this express method call.
    // Right now we go to the index page, but a page that acknowledges that they've been registered would be better.
  });

  //req.session.uuid = recordId; // should add to
  //req.session.email = email;
  user_id = recordId; //for testing
  user_email = email; //for testing
  // create User object
  console.dir(recentSessions);
  // define registration thank you page variables which includes customer first name
  const rThanksHeader = {
    Title: "Success!",
    Subtitle: "Your registration was successful",
    CustFirstName: req.body.firstName,
  };
  console.log("returning thank you page after register post");
  console.log(req.body.firstName);
  // render registration thank you page
  res.render("registerThanks", rThanksHeader);
});

// for testing the login
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
