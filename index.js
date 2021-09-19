// Require dependencies
const logger = require('morgan');
const express = require('express');
const tool = require('./tool');

// Create an Express application
const app = express();
// Configure the app port
const port = 3456;
app.set('port', port);
// Load middlewares
app.use(logger('dev'));

// Start the server and listen on the preconfigured port

function listen(port) {
    return new Promise((resolve, reject) => {
        app.listen(port, () => console.log(`App started on port ${port}`))
        .once('listening', resolve)
        .once('error', reject);
    });
}

async function task() {
    await tool();
    await listen(3456);
    console.log('success');
}

task();







