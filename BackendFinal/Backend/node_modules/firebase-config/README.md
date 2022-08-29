# firebase-config: a command-line utility for working with firebase config files.

`firebase-config` is a utility that lets you manage different firebase config files for different environments. It uses the value of `process.env.NODE_ENV` to determine the appropriate firebase config file for that enviromnent and creates a `firebase.json` file that is a symlink to the firebase config file for that environment.

## Installing globally:

Installation via `npm`.  If you don't have `npm` yet:

     curl https://npmjs.org/install.sh | sh

Once you have `npm`:

     npm install firebase-config -g

This will install `firebase-config` globally so that it may be run from the command line.

## Configuring with package.json:

`firebase-config` uses a special `firebase-config` field in the `package.json` to resolve locations of firebase config files.
For example,

``` json
"firebase-config": {
  "output": "public/",
  "configs": {
    "development": "config/firebase-dev.json",
    "production": "config/firebase-prod.json"
  }
}
```

You can use the `"output"` field to tell `firebase-config` where to place the generated `firebase.json` file. This defaults to the directory containing package.json
The `"configs"` field is a map of values of NODE_ENV to the firebase config files to use for each environment.

## Usage:
Set NODE_ENV
+ linux & mac: export NODE_ENV=production
+ windows: set NODE_ENV=production

Run `firebase-config` from your project directory.
