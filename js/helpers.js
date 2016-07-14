let dataTables = {}

/**
 * Get the Flux user.
 */
function getUser() {
  return sdk.getUser(FluxSDK_Login_Helper.getFluxCredentials())
}

/**
 * Get a project's data table.
 */
function getDataTable(project) {
  if (!(project.id in dataTables)) {
    let dt = new sdk.Project(FluxSDK_Login_Helper.getFluxCredentials(), project.id).getDataTable()
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
  return sdk.Project.createProject(FluxSDK_Login_Helper.getFluxCredentials(), name)
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
function createKey(project, name) {
  let dt = getDataTable(project).table
  return dt.createCell(name, {description: name, value: ''})
  // return new sdk.Cell(getFluxCredentials(), project.id, name)
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
  let credentials = FluxSDK_Login_Helper.getFluxCredentials()
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
