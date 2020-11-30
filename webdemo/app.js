
const express = require("express");
const path = require("path");
const app = express();

// const fs = require("fs");

const PORT = 8000;

// app.use("/static", express.static(path.join(__dirname, "static")));
app.use(express.static("static", {extensions: ["html", "htm"]}));


app.use(express.static("static/media", {extensions: ["jpg", "png", "svg"]}));

app.get("/", (req, res)=>{
    res.sendFile(__dirname +"/static/index.html");
});

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});