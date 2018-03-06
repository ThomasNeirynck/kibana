# X-Pack Kibana Features

This folder has the Kibana X-Pack plugin code

## Setup

You must checkout `x-pack-kibana` and `kibana` with a specific directory structure. The
`kibana` checkout will be used when building `x-pack-kibana`. The structure is:

```
$ ls $PATH_TO_REPOS
 ├── kibana
 └── kibana-extra/x-pack-kibana
 └── elasticsearch (optional)
 └── elasticsearch-extra/x-pack-elasticsearch (optional)
```

I.e. `x-pack-kibana` must live within the `kibana-extra` folder.

#### Working on x-pack-kibana up to and including 6.1?

Up to and including the 6.1 release, x-pack-kibana required a different directory
structure:

```
$ ls $PATH_TO_REPOS
 ├── kibana
 └── x-pack-kibana
 └── elasticsearch (optional)
 └── x-pack-elasticsearch (optional)
```

I.e. `x-pack-kibana` had to be a sibling directory to `kibana`. If you're working
on multiple versions of `x-pack-kibana` and therefore need to handle both types
of directory structures, versioned folders can help, e.g.:

```
├── legacy
│   ├── elasticsearch
│   ├── elasticsearch-extra
│   │   └── x-pack-elasticsearch
│   ├── kibana
│   └── x-pack-kibana
├── master
│   ├── elasticsearch
│   ├── elasticsearch-extra
│   │   └── x-pack-elasticsearch
│   ├── kibana
│   └── kibana-extra
│       └── x-pack-kibana
└── 6.x
    ├── elasticsearch
    ├── elasticsearch-extra
    │   └── x-pack-elasticsearch
    ├── kibana
    └── kibana-extra
        └── x-pack-kibana
```

Another approach is to keep both `../x-pack-kibana` and `../kibana-extra/x-pack-kibana`
in the same folder, e.g.:

```
├── elasticsearch
├── elasticsearch-extra
│   └── x-pack-elasticsearch
├── kibana
│── x-pack-kibana
└── kibana-extra
    └── x-pack-kibana
```

### UI Development

Install the latest version of [yarn](https://yarnpkg.com/en/docs/install).

Bootstrap and install dependencies:

```sh
yarn kbn bootstrap
```

You can also run `yarn kbn` to see the other available commands. For more info
about this tool, see https://github.com/elastic/kibana/tree/master/packages/kbn-build.

#### Running in development

Start elasticsearch with x-pack plugins. Follow x-pack-elasticsearch [Setup Instructions](https://github.com/elastic/x-pack-elasticsearch#setup). Execute `gradle run` from within `elasticsearch-extra/x-pack-elasticsearch`.
Seed elasticsearch with some log data by running `node scripts/makelogs --auth elastic:password` from within `kibana`.

Simply run `yarn start` from within `x-pack-kibana`, and it will bring up Kibana with X-Pack. Default username `elastic` and password `password`.

#### Alternate: Run the build

If this is not the case, or if you rather lean on Kibana, you'll need to perform a build and start Kibana in dev mode with a custom plugin path.

```
# in x-pack-kibana
yarn build

# in kibana
yarn start --plugin-path=../kibana-extra/x-pack-kibana
```

This is also a useful way to test the build. The downside is that **changes are not automatically synced for you**, so you will need to re-run the build every time you want to use the changes you've made (Kibana will automatically restart when you do, if running in dev mode).

#### Alternate: Run Kibana with a config file

You can create an X-Pack-specific config file in your Kibana directory, e.g. `config/xpack.yml`:

```
elasticsearch.username: "elastic"
elasticsearch.password: "password"

xpack.reporting.kibanaServer.port: 5601

plugins.paths:
  - /Users/you/path/to/x-pack-kibana
```

And then from the command line, you can run:

```
# in kibana
bin/kibana --config=config/xpack.yml --dev
```

#### Running server code in debugger

```
# in x-pack-kibana
node --inspect ../../kibana/src/cli -c ../../kibana/config/kibana.dev.yml --plugin-path ./
```

#### Running unit tests_bundle

You can run unit tests by running:

```
yarn test
```

If you want to run tests only for a specific plugin (to save some time), you can run:

```
yarn test --plugins <plugin>[,<plugin>]*    # where <plugin> is "reporting", etc.
```

#### Running tests with flags
```
yarn test
```

#### Running single test file
Edit test file, changing top level `describe` to `describe.only`. Run tests with normal commands.

#### Debugging browser tests
```
yarn test:browser:dev
```
Initializes an environment for debugging the browser tests. Includes an dedicated instance of the kibana server for building the test bundle, and a karma server. When running this task the build is optimized for the first time and then a karma-owned instance of the browser is opened. Click the "debug" button to open a new tab that executes the unit tests.

Run single tests by appending `grep` parameter to the end of the URL. For example `http://localhost:9876/debug.html?grep=ML%20-%20Explorer%20Controller` will only run tests with 'ML - Explorer Controller' in the describe block.

#### Running server unit tests
You can run server-side unit tests by running:

```
yarn test:server
```

#### Running functional tests

The functional tests are run against a live browser, Kibana, and Elasticsearch install. They build their own version of elasticsearch and x-pack-elasticsearch, run the builds automatically, startup the kibana server, and run the tests against them.

To do all of this in a single command run:

```sh
node scripts/functional_tests
```

If you are **developing functional tests** then you probably don't want to rebuild elasticsearch and wait for all that setup on every test run, so instead use this command to get started:

```sh
node scripts/functional_tests_server
```

After all of the setup is running open a new terminal and run this command to just run the tests (without tearing down Elasticsearch, Kibana, etc.)

```sh
# make sure you are in the x-pack-kibana project
cd x-pack-kibana

# this command accepts a bunch of arguments to tweak the run, try sending --help to learn more
node ../../kibana/scripts/functional_test_runner
```

#### Running API integration tests

API integration tests are very similar to functional tests in a sense that they are organized in the same way and run against live Kibana and Elasticsearch instances.
The difference is that API integration tests are intended to test only programmatic API exposed by Kibana. There is no need to run browser and simulate user actions that significantly reduces execution time.

To build, run `x-pack-kibana` with `x-pack-elasticsearch` and then run API integration tests against them use the following command:

```sh
node scripts/functional_tests_api
```

If you are **developing api integration tests** then you probably don't want to rebuild `x-pack-elasticsearch` and wait for all that setup on every test run, so instead use this command to get started:

```sh
node scripts/functional_tests_server
```

Once Kibana and Elasticsearch are up and running open a new terminal and run this command to just run the tests (without tearing down Elasticsearch, Kibana, etc.)

```sh
# make sure you are in the x-pack-kibana project
cd x-pack-kibana

# this command accepts a bunch of arguments to tweak the run, try sending --help to learn more
node ../../kibana/scripts/functional_test_runner --config test/api_integration/config.js
```

You can also run API integration tests with SAML support. The `--saml` option configures both Kibana and Elasticsearch 
with the SAML security realm, as required by the SAML security API.

Start the functional test server with SAML support:

```sh
node scripts/functional_tests_server --saml
```

Then run the tests with:
```sh
# make sure you are in the x-pack-kibana project
cd x-pack-kibana

# use a different config for SAML
node ../../kibana/scripts/functional_test_runner --config test/saml_api_integration/config.js
```

### Issues starting dev more of creating builds

You may see an error like this when you are getting started:

```
[14:08:15] Error: Linux x86 checksum failed
    at download_phantom.js:42:15
    at process._tickDomainCallback (node.js:407:9)
```

That's thanks to the binary Phantom downloads that have to happen, and Bitbucket being annoying with throttling and redirecting or... something. The real issue eludes me, but you have 2 options to resolve it.

1. Just keep re-running the command until it passes. Eventually the downloads will work, and since they are cached, it won't ever be an issue again.
1. Download them by hand [from Bitbucket](https://bitbucket.org/ariya/phantomjs/downloads) and copy them into the `.phantom` path. We're currently using 1.9.8, and you'll need the Window, Mac, and Linux builds.

## Building and Packaging

Make sure you have the dependencies installed by running `yarn kbn bootstrap`.

Once complete, use `yarn build`. Output will be placed in the `build` path (it will be created).

To drop the `SNAPSHOT` off the version, use the release flag, `-r` or `--release`

If you'd like to get a zip package and a sha1 checksum file, use `yarn package`. Output will be placed in the `target` path (it will be created). Resulting build output will also be left in the `build` path.

## Releasing

Make sure you have the dependencies installed by running `yarn kbn bootstrap`.

Once complete, use `yarn release`. Build and package output will be placed in the `build` and `target` paths respectively (they will be created).

Note that you will need AWS credentials for the upload to succeed. To provide these credentials, create a `~/.aws/credentials` file with your credentials, which should look like this:

```
[default] ; the default profile
aws_access_key_id = ...
aws_secret_access_key = ...

[another-config] ; my "personal-account" profile
aws_access_key_id = ...
aws_secret_access_key = ...
```

The `default` profile is used automatically, but setting the `AWS_PROFILE` environment variable will allow you to use another profile, if you happen to have multiple.

`AWS_PROFILE=another-config yarn release`

See [the AWS docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Creating_the_Shared_Credentials_File) for more information.

# Building documentation

This repo contains X-Pack information that is used in the Kibana User Guide in 5.5 and later.

To build the Kibana User Guide on your local machine, ensure you have the following folders:

```
$ ls $PATH_TO_REPOS
 ├── kibana
 └── kibana-extra/x-pack-kibana
 
```

To build the Kibana User Guide, use the docbldkb or docbldkbx build commands defined in https://github.com/elastic/docs/blob/master/doc_build_aliases.sh

