// [Eric]
// This script launches the intro as long as it hasn't been told to skip.

// Grab a pointer to the intro wrapper
const intro = document.getElementById('introWrap');

// We don't run the intro if the loader has been given a skipIntro variable. This is added through the template only when accessed by one of the nav links.
if (intro.dataset.skipIntro == "true") {
  // If the skip is found, we simply remove the intro from the display - it never happened
  intro.style.display = 'none';

  // Otherwise, we run the normal chain of events that cause the intro to happen
} else {
    // Loader function - once everything above has loaded, this function calls a 3 second timer then adds load class to body, triggering animations
    setTimeout(function () {
      const body = document.getElementsByTagName("body")[0];
      body.classList.add("loaded");
    }, 3000);
    setTimeout(function () {
      //A second timer brings the window back to the top just before the page reveals, to counter random scroll flailing
      window.scrollTo(0, 0);
    }, 8400);
}
