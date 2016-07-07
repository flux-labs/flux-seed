#Flux: Seed Project

This is a seed project for you to get started developing Flux apps with the web SDK.
This project includes some of the essential concepts for working with Flux: a 3D viewport for viewing geometry data,
an slider for sending numerical data to Flux, a display box for viewing data from Flux, and an input for creating a Flux key.
The application logic is contained in js/index.js, and the SDK calls in js/helpers.js.  

### Usage

* Download or clone this repository. ``` git clone https://github.com/flux-labs/flux-seed.git) ```
* Sign up for a [Flux account](https://flux.io/) if you don't have one already. 
* Register your project and get a [Flux Client ID](https://flux.io/developer/apps/).
* Rename the config file from js/config.sample.js to js/config.js and insert your Client ID.
* Set up and run an HTTP server from your project directory.
  * PYTHON: ``` python -m SimpleHTTPServer 8080 ```
  * NODEJS: ``` npm install -g live-server; live-server ```
* Open your browser to http://localhost:8080
* Enjoy!
