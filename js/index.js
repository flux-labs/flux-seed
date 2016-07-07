let viewport, projects, selectedProject, projectKeys

// Check if we're coming back from Flux with the login credentials.
setFluxLogin()

/**
 * Check if the user is logged in.
 */
function checkLogin() {
  // get the credentials from local storage
  let credentials = getFluxCredentials()
  // if the user doesn't have credentials, reject the promise
  if (!credentials) return Promise.reject()
  // else resolve it
  return Promise.resolve()
}

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
function showLogin(err) {
  // remove the credentials from local storage
  localStorage.removeItem('fluxCredentials')
  // show the login button
  $('#login').css('display', 'flex')
  // attach event handler to the login button
  $('#login .button').click(getFluxLogin)
}

/**
 * Fetch the user's projects from Flux.
 */
function fetchProjects() {
  // get the user's projects from flux (returns a promise)
  getProjects().then((data) => {
    projects = data.entities
    // for each project, create an option for the select box with
    // the project.id as the value and the project.name as the label
    let options = projects.map((project) => {
      return $('<option>').val(project.id).text(project.name)
    })
    // insert the default text as the first option
    options.unshift('<option>Please select a project</option>')
    // make sure the select box is empty and then insert the new options
    $('select.project').empty().append(options)
    // empty out the project key select boxes
    $('select.key').empty()
    // attach a function to the select box change event
    $('select.project').on('change', (e) => {
      // find the project that was clicked on, and assign it to the global
      // variable 'selectedProject'
      selectedProject = projects.filter((p) => p.id === e.target.value)[0]
      // now go fetch the project's keys
      fetchKeys()
    })
  })
}

/**
 * Fetch the keys of the currently selected project from Flux.
 */
function fetchKeys() {
  // get the project's keys from flux (returns a promise)
  getKeys(selectedProject).then((data) => {
    // assign the keys to the global variable 'projectKeys'
    projectKeys = data.entities
    // for each project, create an option for the select box with
    // the key.id as the value and the key.label as the label
    let options = projectKeys.map((key) => {
      return $('<option>').val(key.id).text(key.label)
    })
    // insert the default text as the first option
    options.unshift('<option>Please select a key</option>')
    // make sure the select box is empty and then insert the new options
    $('select.key').empty().append(options)
  })
}

/**
 * Attach events to the key selection boxes.
 */
function initKeys() {
  // attach a function to the change event of the viewport's key select box
  $('#geometry select.key').on('change', (e) => {
    // find the key that was clicked on
    let selectedKey = projectKeys.filter((k) => k.id === e.target.value)[0]
    // if we have both a project and a key
    if (selectedProject && selectedKey) {
      // get the value of the key (returns a promise)
      getValue(selectedProject, selectedKey).then((data) => {
        // and add it to the viewport
        viewport.setGeometryEntity(data.value)
      })
    }
  })

  // attach a function to the change event of the output select box
  $('#output select.key').on('change', (e) => {
    // find the key that was clicked on
    let selectedKey = projectKeys.filter((k) => k.id === e.target.value)[0]
    const render = (data) => {
      // check if the value is a number
      let d = parseFloat(data.value)
      // otherwise make it into a string
      if (isNaN(d)) d = JSON.stringify(data.value)
      else d = d + ''
      // calculate the approximate display size for the text
      // based on the ammount of content (length)
      let size = Math.max((1/Math.ceil(d.length/20)) * 3, 0.8)
      // apply the new text size to the content
      $('#display .content').html(d).css('font-size', size+'em')
    }
    // if we have both a project and a key
    if (selectedProject && selectedKey) {
      // get the value of the key (returns a promise)
      getValue(selectedProject, selectedKey).then((data) => {
        // and render it with the function above
        render(data)
        // whenever the data on Flux changes, get the live update
        // and re-render it (websocket connection)
        onKeyChange(selectedProject, selectedKey, render)
      })
    }
  })

  // attach a function to the change event of the slider's (input) select box
  $('#input select.key').on('change', (e) => {
    // find the key that was clicked on
    let selectedKey = projectKeys.filter((k) => k.id === e.target.value)[0]
    // and attach it to the slider so we can grab it later
    $('#input input').data('key', selectedKey)
  })

  // attach a function to the change event of the slider
  $('#input input').on('change', (e) => {
    // find the key that was clicked on (we attached it in the previous function)
    let key = $(e.target).data('key')
    // update the display with the new value
    $('#input .label .value').html(e.target.value)
    // and if we have a key
    if (key) {
      // tell flux to update the key with this new value
      updateKeyValue(selectedProject, key, e.target.value)
    }
  })

  // initialize the slider's displayed value
  $('#input .label .value').html($('#input input').val())
}

/**
 * Initialize the create key input + button.
 */
function initCreate() {
  $('#create .button').on('click', (e) => {
    // get the input field
    let input = $(e.target).parent().find('input')
    // get the input field value
    let value = input.val()
    // check we have a name
    if (value === '') return
    // check we have a project selected
    if (!selectedProject) return
    // create the key (returns a promise)
    createKey(selectedProject, value).then(() => {
      // clear the input
      input.val('')
      // refresh the key select boxes
      fetchKeys()
    })
  })
}

/**
 * Initialize the 3D viewport.
 */
function initViewport() {
  // attach the viewport to the #div view
  viewport = new FluxViewport(document.querySelector("#view"))
  // set up default lighting for the viewport
  viewport.setupDefaultLighting()
  // set the viewport background to white
  viewport._renderer.setClearColor(0xffffff)
  // remove the axis lines
  viewport._renderer._helpersScene.remove(viewport._renderer._helpers)
  animate()
}

/**
 * Start the viewport's render loop.
 */
function animate() {
  // on every frame, call this function
  requestAnimationFrame(animate)
  // and render the viewport
  viewport.render()
}

/**
 * Start the application.
 */
function init() {
  // check that the user is logged in, otherwise show the login page
  checkLogin().then(() => {
    // if logged in, make sure the login page is hidden
    hideLogin()
    // create the viewport
    initViewport()
    // prepare the key select boxes
    initKeys()
    // prepare the create key input + button
    initCreate()
    // get the user's projects from Flux
    fetchProjects()
  }).catch(showLogin)
}

// When the window is done loading, start the application.
window.onload = init
