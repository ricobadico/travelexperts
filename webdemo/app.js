
const express = require("express");
const path = require("path");
const app = express();

//const fs = require("fs");

const PORT = 8000;

app.use("/static", express.static(__dirname));
app.use(express.static("static", {extensions: ["jpg", "png"]}));

app.get("/", (req, res)=>{
    res.sendFile(__dirname +"/static/index.html");
});

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});