// create a place to hold global vars
if (!window.webapp) {
  window.webapp = {};
  webapp.introAnimation = true;
}

if (webapp.introAnimation) {
  // Loader function - once everything above has loaded, this function calls a 3 second timer then adds load class to body, triggering animations
  setTimeout(function () {
    const body = document.getElementsByTagName("body")[0];
    body.classList.add("loaded");
  }, 3000);
  setTimeout(function () {
    //A second timer brings the window back to the top just before the page reveals, to counter random scroll flailing
    window.scrollTo(0, 0);
  }, 8400);
  // set to false after run once
  webapp.introAnimation = false;
}
