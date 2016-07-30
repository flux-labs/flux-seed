var viewport

/**
 * Hide the login page and attach events to the logout button.
 */
function hideLogin() {
  // hide the login button
  $('#login').hide()
  // attach the event handler to the logout button
  $('#logout').click(showLogin)
}

/**
 * Show the login page and attach events to the login button.
 */
function showLogin() {
  // ensure that the user is logged out and no longer stored on the page
  helpers.logout()
  // show the login button
  $('#login').css('display', 'flex')
  // attach event handler to the login button
  $('#login .button').click(function() { helpers.redirectToFluxLogin() })
}

/**
 * Initialize the 3D viewport.
 */
function initViewport() {
  // hide the error screen
  $('#view-error').hide()
  // attach the viewport to the #div view
  viewport = new FluxViewport(document.querySelector("#view"))
  // set up default lighting for the viewport
  viewport.setupDefaultLighting()
  // set the viewport background to white
  viewport.setClearColor(0xffffff)
}

/**
 * Start the application.
 */
function init() {
  // Check if we're coming back from Flux with the login credentials.
  helpers.storeFluxUser()
  // check that the user is logged in, otherwise show the login page
    .then(function() { return helpers.isLoggedIn() })
    .then(function(isLoggedIn) {
      if (isLoggedIn) {
        // if logged in, make sure the login page is hidden
        hideLogin()
        // create the viewport
        initViewport()
        //manually set the viewport's geometry to box_data
        viewport.setGeometryEntity(box_data)
      } else {
        showLogin();
      }
    })
}

// When the window is done loading, start the application.
window.onload = init
