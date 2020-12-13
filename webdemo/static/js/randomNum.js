// Added by [Eric] - just a function from the node classes
exports.randomNum = function randomNum(max) {
    let randNum= Math.ceil(Math.random() * Math.floor(max));
    console.log(randNum);
    return randNum;
}