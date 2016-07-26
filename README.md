#Flux: Seed Project

This is a [seed project](https://seed.flux.kitchen) for you to get started developing Flux apps with the web SDK.
This project includes some of the essential concepts for working with Flux: a 3D viewport for viewing geometry data,
an slider for sending numerical data to Flux, a display box for viewing data from Flux, and an input for creating a Flux key.
The application logic is contained in js/index.js, and the SDK calls in js/helpers.js.  

### Usage

* Download or clone this repository. ``` git clone https://github.com/flux-labs/flux-seed.git ```
* Sign up for a [Flux account](https://flux.io/) if you don't have one already. 
* Register your project and get a [Flux Client ID](https://flux.io/developer/apps/).
* Insert your Client ID in the config file (js/config.js).
* Set up and run an HTTP server from your project directory.
  * PYTHON 2.x: ``` python -m SimpleHTTPServer 8080 ```
  * PYTHON 3.x: ``` python -m http.server 8080 ```
  * NODEJS: ``` sudo npm install -g live-server; live-server ```
* Open your browser to http://localhost:8080
* Enjoy!
