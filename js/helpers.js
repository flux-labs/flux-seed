// instantiate the Flux SDK with your appliation key
var sdk = new FluxSdk(config.flux_key, { redirectUri: config.url, fluxUrl: config.flux_url })
var dataTables = {}

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
    var dt = new sdk.Project(getFluxCredentials(), project.id).getDataTable()
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
 * Get a list of the project's cells (keys).
 */
function getCells(project) {
  return getDataTable(project).table.listCells()
}

/**
 * Get a specific project cell (key).
 */
function getCell(project, cell) {
  return getDataTable(project).table.getCell(cell.id)
}

/**
 * Create a project cell (key) in Flux.
 */
function createCell(project, name) {
  var dt = getDataTable(project).table
  return dt.createCell(name, {description: name, value: ''})
  // return new sdk.Cell(getFluxCredentials(), project.id, name)
}

/**
 * Get the value contained in a cell (key).
 */
function getValue(project, cell) {
  return getCell(project, cell).fetch()
}

/**
 * Update the value in a project cell (key).
 */
function updateCellValue(project, cell, value) {
  var credentials = getFluxCredentials()
  var cell = new sdk.Cell(credentials, project.id, cell.id)
  cell.update({value: value})
}

/**
 * Creates a websocket for a project that listens for data table events, and calls 
 * the supplied handler function
 */
function createWebSocket(project, notificationHandler){
  var dataTable = getDataTable(project)
  var options = {
    onOpen: function() { console.log('Websocket opened.') },
    onError: function() { console.log('Websocket error.') }
  }

  // if this data table doesn't have websockets open
  if (!dataTable.websocketOpen) {
    dataTable.websocketOpen = true
    // open them
    dataTable.table.openWebSocket(options)

    // and attach the handler we created above
    if(notificationHandler)
      dataTable.table.addWebSocketHandler(notificationHandler)
  }
}

/**
 * Generate a random token.
 */
function generateRandomToken() {
  var tokenLength = 24
  var randomArray = []
  var characterSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (var i = 0; i < tokenLength; i++) {
    randomArray.push(Math.floor(Math.random() * tokenLength))
  }
  return btoa(randomArray.join('')).slice(0, 48)
}

/**
 * Generate a token for use in the login.
 */
function getState() {
  var state = localStorage.getItem('state') || generateRandomToken()
  localStorage.setItem('state', state)
  return state
}

/**
 * Generate a token for use in the login.
 */
function getNonce() {
  var nonce = localStorage.getItem('nonce') || generateRandomToken()
  localStorage.setItem('nonce', nonce)
  return nonce
}
