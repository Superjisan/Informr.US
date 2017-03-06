# Inform-R-Us

You can see a demo of this app [here](https://www.informr.us)

To run this app, you'll need:

 * node.js (recommended version: 6.9.2), npm (recommended version 3.10.9)

You can clone this app using git

```
git clone https://github.com/Superjisan/Informr.US.git
```

To run this app, you'll need to set a `.env` file at the root directory of this project. The `.env` file should contain the API key for Sunlight Foundation.

Example `.env` file

```javascript
OPEN_STATES_API_KEY={YOUR_KEY_HERE}
```

UPDATE: there's no need for apikey anymore, and you can just use your email apparently: http://docs.openstates.org/en/latest/api/#basics

After setting up an env file, ensure that you run

```
npm install
```

After that is all set up, you can run the server using

```
npm start
```

The above command should set up a server at `localhost:3002`. So head over at that url in your browser.

You should see something like this:

<img src="https://raw.githubusercontent.com/superjisan/InformRU/master/informRUDemo.gif" width="800">