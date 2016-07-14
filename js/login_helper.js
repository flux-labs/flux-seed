/*
* Flux SDK Login Helper.
*
* This file contains logic to help a web developer get started using the
* authentication API exposed by the Flux SDK.
*
* Use of this file will write to localStorage using the LOGIN_HELPER_KEY
* defined below.
*
* This file currently assumes that a Flux SDK instance has been bound to the
* global name: sdk.
*/

// TODO: Consider using some tool to auto-generate various module/inclusion patterns.
FluxSDK_Login_Helper = (function() {
    const LOGIN_HELPER_KEY = '__Flux_Login_Helper_Data__';

    /*
    * Get the value of key in the object stored under LOGIN_HELPER_KEY.
    *
    * Null is returned instead of undefined to mimic the behavior of localStorage.
    * It is unclear to me whether that's the right thing to do.
    *
    * @param key Key
    *
    * @returns The value of key.
    */
    function getLocalStore(key) {
        let data;
        try {
            data = JSON.parse(localStorage.getItem(LOGIN_HELPER_KEY));
        } catch (e) {
            // If we have bad data then just reset.
            localStorage.removeItem(LOGIN_HELPER_KEY);
            return;
        }
        if (!data) {
            return null;
        }
        let value = data[key];
        if (value === undefined) {
            return null
        }
        return value;
    }

    /*
    * Update the object stored under LOGIN_HELPER_KEY.
    *
    * @param key Key
    * @param value Value
    *
    * @returns The previous value of key.
    */
    function updateLocalStore(key, value) {
        let data;
        // TODO: Extract try/catch into separate function.
        try {
            data = JSON.parse(localStorage.getItem(LOGIN_HELPER_KEY));
        } catch (e) {
            // If we have bad data then just reset.
            data = {};
        }
        if (!data) {
            data = {};
        }
        let previousValue = data[key];
        data[key] = value;
        localStorage.setItem(LOGIN_HELPER_KEY, JSON.stringify(data));
        return previousValue;
    }


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
     * Redirect the user to the Flux login page.
     */
    function getFluxLogin() {
      window.location.replace(sdk.getAuthorizeUrl(getRandomToken('state'), getRandomToken('nonce')))
    }

    /**
     * Check if we're coming from Flux with the credentials, and store them.
     */
    function setFluxLogin() {
      // if the user is logged out and the url contains the access token
      if (!getFluxCredentials() && window.location.hash.match(/access_token/)) {
        // get the credentials from Flux (returns a promise)
        sdk.exchangeCredentials(getRandomToken('state'), getRandomToken('nonce'))
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
        return getLocalStore('fluxCredentials');
    }

    /**
     * Set the credentials in local storage.
     */
    function setFluxCredentials(credentials) {
        updateLocalStore('fluxCredentials', credentials);
    }

    /**
     * Clear the credentials in local storage.
     */
    function clearFluxCredentials(credentials) {
        updateLocalStore('fluxCredentials', null);
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

    function getRandomToken(key) {
        let token = getLocalStore(key);
        if (token) {
            return token;
        }
        token = generateRandomToken();
        updateLocalStore(key, token);
        return token;
    }

    return {
        getFluxCredentials: getFluxCredentials,
        clearFluxCredentials: clearFluxCredentials,
        checkLogin: checkLogin,
        gotoFluxLogin: gotoFluxLogin,
    }
})();
