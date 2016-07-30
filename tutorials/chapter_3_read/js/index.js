var viewport, projects, selectedProject, projectCells, selectedOutputCell

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

function render(data) {
  if(!data){
    viewport.setGeometryEntity(null)
  }
  else if (FluxViewport.isKnownGeom(data.value)) {
    //add it to the viewport
    viewport.setGeometryEntity(data.value)
  } 
}

/**
 * Fetch the cells (keys) of the currently selected project from Flux.
 */
function fetchCells() {
  // get the project's cells (keys) from flux (returns a promise)
  getCells(selectedProject).then(function(data) {
    // assign the cells to the global variable 'projectCells'
    projectCells = data.entities
    // for each project, create an option for the select box with
    // the cell.id as the value and the cell.label as the label
    var options = projectCells.map(function(cell) {
      return $('<option>').val(cell.id).text(cell.label)
    })
    // insert the default text as the first option
    options.unshift('<option>Please select a cell</option>')
    // make sure the select box is empty and then insert the new options
    $('select.cell').empty().append(options)
    //clear the display by rendering with null data
    render(null)
  })
}

/**
 * Fetch the user's projects from Flux.
 */
function fetchProjects() {
  // get the user's projects from flux (returns a promise)
  getProjects().then(function(data) {
    projects = data.entities
    // for each project, create an option for the select box with
    // the project.id as the value and the project.name as the label
    var options = projects.map(function(project) {
      return $('<option>').val(project.id).text(project.name)
    })
    // insert the default text as the first option
    options.unshift('<option>Please select a project</option>')
    // make sure the select box is empty and then insert the new options
    $('select.project').empty().append(options)
    // empty out the project cell (key) select boxes
    $('select.cell').empty()
    // attach a function to the select box change event
    $('select.project').on('change', function(e) {
      // find the project that was clicked on, and assign it to the global
      // variable 'selectedProject'
      selectedProject = projects.filter(function(p) { return p.id === e.target.value })[0]
      
      // now go fetch the project's cells (keys)
      fetchCells()
    })
  })
}

/**
 * Attach events to the cell (key) selection boxes.
 */
function initCells() {
  // attach a function to the change event of the viewport's cell (key) select box
  $('#output select.cell').on('change', function(e) {
    // find the cell that was clicked on
    selectedOutputCell = projectCells.filter(function(k) { return k.id === e.target.value })[0]
    
    if (selectedProject && selectedOutputCell) {
      // get the value of the cell (returns a promise)
      getValue(selectedProject, selectedOutputCell).then(function(data) {
        // and render it
        render(data)
      })
    }
  })
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
        // get the user's projects from Flux
        fetchProjects()
        // prepare the cell (key) select boxes
        initCells()
      } else {
        showLogin();
      }
    })
}

// When the window is done loading, start the application.
window.onload = init
