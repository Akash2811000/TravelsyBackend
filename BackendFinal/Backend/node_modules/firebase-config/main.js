#! /usr/bin/env node
var exec = require('child_process').exec;
var cwd = process.cwd();
var pkg = require(cwd + '/package.json');


if (!pkg) {
  exitOnError(
    'No package.json found in the current working directory. ' +
    'Please run firebase-config from the directory containing your package.json.'
  );
}

// Extract the "firebase-config" field from package.json.
var firebaseConfig = pkg['firebase-config'];

if (!firebaseConfig) {
  exitOnError('firebase-config requires a "firebase-config" field in package.json.');
}

var configs = firebaseConfig['configs'];
if (!configs) {
  exitOnError('firebase-config requires a "configs" field in the "firebase-config" object.');
}

var environment = process.env.NODE_ENV;
if (!environment) {
  exitOnError('NODE_ENV is not set.');
}

var envConfig = configs[environment];
if (!envConfig) {
  exitOnError(
    'The "configs" field does not specify a firebase config for environment ' + environment + ".");
}

var outputDir = firebaseConfig['output'];
if (!outputDir) {
  // Output directory not provided. Fallback to cwd.
  outputDir = cwd;
}
var outputPath = outputDir + '/firebase.json';

var linkCmd = 'ln -s -f ' + envConfig + ' ' + outputPath;
exec(linkCmd, function (error) {
  if (error !== null) {
    exitOnError(error);
  } else {
    console.log("Successfully linked " + outputPath + " to " + envConfig);
  }
});

function exitOnError(message) {
  process.stderr.write('Error: ' + message);
  process.exit(1);
}
