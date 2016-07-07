// instantiate the Flux SDK with your appliation key
let sdk = new FluxSdk(config.flux_key, { redirectUri: config.url, fluxUrl: config.flux_url })
let dataTables = {}

/**
 * Redirect the user to the Flux login page.
 */
function getFluxLogin() {
  window.location.replace(sdk.getAuthorizeUrl(getState(), getNonce()))
}

/**
 * Check if we're coming from Flux with the credentials, and store them.
 */
function setFluxLogin() {
  // if the user is logged out and the url contains the access token
  if (!getFluxCredentials() && window.location.hash.match(/access_token/)) {
    // get the credentials from Flux (returns a promise)
    sdk.exchangeCredentials(getState(), getNonce())
      // and set them in local storage
      .then(function(credentials) { setFluxCredentials(credentials) })
      // and clean up the url
      .then(function() { window.location.replace(config.url) })
  }
}

/**
 * Get the credentials from local storage.
 */
function getFluxCredentials() {
  return JSON.parse(localStorage.getItem('fluxCredentials'))
}

/**
 * Set the credentials in local storage.
 */
function setFluxCredentials(credentials) {
  localStorage.setItem('fluxCredentials', JSON.stringify(credentials))
}

/**
 * Get the Flux user.
 */
function getUser() {
  return sdk.getUser(getFluxCredentials())
}

/**
 * Get a project's data table.
 */
function getDataTable(project) {
  if (!(project.id in dataTables)) {
    let dt = new sdk.Project(getFluxCredentials(), project.id).getDataTable()
    dataTables[project.id] = { table: dt, handlers: {}, websocketOpen: false }
  }
  return dataTables[project.id]
}

/**
 * Get the user's Flux projects.
 */
function getProjects() {
  return getUser().listProjects()
}

/**
 * Create a project in Flux.
 */
function createProject(name) {
  return sdk.Project.createProject(getFluxCredentials(), name)
}

/**
 * Get a list of the project's keys.
 */
function getKeys(project) {
  return getDataTable(project).table.listCells()
}

/**
 * Get a specific project key.
 */
function getKey(project, key) {
  return getDataTable(project).table.getCell(key.id)
}

/**
 * Create a project key in Flux.
 */
function createKey(pid, key) {
  return new sdk.Cell(getFluxCredentials(), pid, key)
}

/**
 * Get the value contained in a key.
 */
function getValue(project, key) {
  return getKey(project, key).fetch()
}

/**
 * Update the value in a project key.
 */
function updateKeyValue(project, key, value) {
  let credentials = getFluxCredentials()
  let cell = new sdk.Cell(credentials, project.id, key.id)
  cell.update({value: value})
}

/**
 * Subscribe to the changes in a key with websockets.
 */
function onKeyChange(project, key, cb) {
  let pid = project.id
  let kid = key.id
  let dt = getDataTable(project)
  let options = {
    onOpen: () => console.log('Websocket opened for '+ pid + ' ' + kid + '.'),
    onError: () => console.log('Websocket error for '+ pid + ' ' + kid + '.')
  }

  // function that calls the correct handlers for particular key ids, if set.
  const websocketRefHandler = (msg) => {
    console.log('Notification received.', msg)
    if (dt.handlers.hasOwnProperty(msg.body.id)) {
      console.log('Calling handlers for '+ pid + ' ' + kid + '.')
      dt.handlers[msg.body.id](msg)
    } else console.log('Received a notification, but key id is not matched by any callback handlers.')
  }

  // the handler for this key
  dt.handlers[kid] = (msg) => {
    if (msg.body.id === kid) {
      this.getValue(project, key).then(cb)
    }
  }

  // if this data table doesn't have websockets open
  if (!dt.websocketOpen) {
    dt.websocketOpen = true
    // open them
    dt.table.openWebSocket(options)
    // and attach the handler we created above
    dt.table.addWebSocketHandler(websocketRefHandler)
  }
}

/**
 * Generate a random token.
 */
function generateRandomToken() {
  let tokenLength = 24
  let randomArray = []
  let characterSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let i = 0; i < tokenLength; i++) {
    randomArray.push(Math.floor(Math.random() * tokenLength))
  }
  return btoa(randomArray.join('')).slice(0, 48)
}

/**
 * Generate a token for use in the login.
 */
function getState() {
  let state = localStorage.getItem('state') || generateRandomToken()
  localStorage.setItem('state', state)
  return state
}

/**
 * Generate a token for use in the login.
 */
function getNonce() {
  let nonce = localStorage.getItem('nonce') || generateRandomToken()
  localStorage.setItem('nonce', nonce)
  return nonce
}
