
const express = require("express");
const path = require("path");
const handlebars = require("express-handlebars");

const app = express();

app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars({
    extname: "handlebars",
    defaultLayout: ""
}))

// const fs = require("fs");

const PORT = 8000;

// app.use("/static", express.static(path.join(__dirname, "static")));
app.use(express.static("static", {extensions: ["html", "htm"]}));


app.use(express.static("static/media", {extensions: ["jpg", "png", "svg"]}));

app.get("/", (req, res)=>{
    res.sendFile(__dirname +"/static/index.html");
});

app.get("/handlebars", (req,res) => {
    res.render(__dirname + "/static/contact.handlebars", { handlebartitle: "WELCOME TO QUEENS GAMBIT CITY", detail: "GIVE US A CALL", tidbit: ["hello", "what's up"] })
})

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});
