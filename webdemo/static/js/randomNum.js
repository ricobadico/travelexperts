exports.randomNum = function randomGreeting(max) {
    let randNum= Math.ceil(Math.random() * Math.floor(max));
    console.log(randNum);
    return randNum;
}