// instantiate the Flux SDK with your appliation key
var sdk = new FluxSdk(config.flux_client_id, { redirectUri: config.url, fluxUrl: config.flux_url })
var helpers = new FluxHelpers(sdk)
var user = null
var dataTables = {}

/**
 * Get the Flux user.
 */
function getUser() {
  if (!user) {
    user = helpers.getUser()
  }
  return user
}

/**
 * Get the user's Flux projects.
 */
function getProjects() {
  return getUser().listProjects()
}

/**
 * Get a project's data table.
 */
function getDataTable(project) {
  if (!(project.id in dataTables)) {
    var dt = getUser().getDataTable(project.id)
    dataTables[project.id] = { table: dt, handlers: {}, websocketOpen: false }
  }
  return dataTables[project.id]
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
 * Get the value contained in a cell (key).
 */
function getValue(project, cell) {
  return getCell(project, cell).fetch()
}

/**
 * Update the value in a project cell (key).
 */
function updateCellValue(project, cell, value) {
  var cell = getUser().getCell(project.id, cell.id)
  return cell.update({value: value})
}

/**
 * Create a project cell (key) in Flux.
 */
function createCell(project, name) {
  var dt = getDataTable(project).table
  return dt.createCell(name, {description: name, value: ''})
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