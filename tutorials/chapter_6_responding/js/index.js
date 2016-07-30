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
  //check to see if data is available to render
  if (!data) {
    //empty the display and hide the geometry viewport
    $('#display .content').empty()
    $('#display').show()
    $('#geometry').hide()
  }
  //check to see if the data is a known type of geometry
  else if (FluxViewport.isKnownGeom(data.value)) {
    //add it to the viewport
    viewport.setGeometryEntity(data.value)
    //swap the display types
    $('#geometry').show()
    $('#display').hide()
  } else {
    // not geometry, so figure out how to best render the type
    // check if the value is a number
    var d = parseFloat(data.value)
    // otherwise make it into a string
    if (isNaN(d)) d = JSON.stringify(data.value)
    else d = d + ''
    // calculate the approximate display size for the text
    // based on the ammount of content (length)
    var size = Math.max((1/Math.ceil(d.length/20)) * 3, 0.8)
    // apply the new text size to the content
    $('#display .content').html(d).css('font-size', size+'em')
    // if the content is json
    if (d[0] === '[' || d[0] === '{') {
      // align left
      $('#display .content').css('text-align', 'left')
    } else {
      // align center
      $('#display .content').css('text-align', 'center')
    }
    //swap the display types
    $('#geometry').hide()
    $('#display').show()
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
      var c = $('#console')
      c.val('')
      var notificationHandler = function(msg) {
        //write all events to the app console
        c.val(c.val() + msg.type + ': \'' + msg.body.label + '\'\n')
        if (msg.type === "CELL_MODIFIED") {
          //only render when the modification involves the selected output
          if(selectedOutputCell && (selectedOutputCell.id === msg.body.id)) {
            getValue(selectedProject, selectedOutputCell).then(render)
          }
        }
      }
      //listens and responds to changes on flux using our handler
      createWebSocket(selectedProject, notificationHandler)
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

  // attach a function to the change event of the slider's (input) select box
  $('#input select.cell').on('change', function(e) {
    // find the cell that was clicked on
    var selectedCell = projectCells.filter(function(k) { return k.id === e.target.value })[0]
    // and attach it to the slider so we can grab it later
    $('#input input').data('cell', selectedCell)
  })

  // attach a function to the change event of the slider
  $('#input input').on('change', function(e) {
    // find the cell that was clicked on (we attached it in the previous function)
    var cell = $(e.target).data('cell')
    // update the display with the new value
    $('#input .label .value').html(e.target.value)
    // and if we have a cell
    if (cell) {
      // tell flux to update the cell with this new value
      updateCellValue(selectedProject, cell, parseFloat(e.target.value))
    }
  })

  // initialize the slider's displayed value
  $('#input .label .value').html($('#input input').val())
}

/**
 * Initialize the create cell (key) input + button.
 */
function initCreate() {
  $('#create .button').on('click', function(e) {
    // get the input field
    var input = $(e.target).parent().find('input')
    // get the input field value
    var value = input.val()
    // check we have a name
    if (value === '') return
    // check we have a project selected
    if (!selectedProject) return
    // create the cell (key)
    createCell(selectedProject, value).then(function() {
      // clear the input
      input.val('')
      // refresh the cell (key) select boxes
      fetchCells()
    })
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
        // prepare the cell (key) select boxes
        initCells()
        // prepare the create key input + button
        initCreate()
        // get the user's projects from Flux
        fetchProjects()
      } else {
        showLogin();
      }
    })
}

// When the window is done loading, start the application.
window.onload = init
