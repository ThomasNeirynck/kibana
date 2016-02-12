## Using Monitoring

The easiest way to get to know the new Monitoring is probably by [reading the
docs](https://github.com/elastic/x-plugins/blob/master/docs/public/marvel/index.asciidoc).

Install the distribution the way a customer would is pending the first release
of Unified X-Pack plugins.

## Developing

You will need to get Elasticsearch and X-Pack plugins for ES that match the
version of the UI. The best way to do this is to run `gradle run` from a clone
of the x-plugins repository.

To set up Monitoring and automatic file syncing code changes into Kibana's plugin
directory, clone the kibana and x-plugins repos in the same directory and from
`x-plugins/kibana/monitoring`, run `npm start`.

Once the syncing process has run at least once, start the Kibana server in
development mode. It will handle restarting the server and re-optimizing the
bundles as-needed. Go to https://localhost:5601 and click Monitoring from the App
Drawer.

## Running tests

```
npm run test
```

- Debug tests
Add a `debugger` line to create a breakpoint, and then:

```
gulp sync && mocha debug --compilers js:babel-register /pathto/kibana/installedPlugins/monitoring/pathto/__test__/testfile.js
```

## Deploying

Monitoring is part of XPack, and only a single XPack artifact needs to be
deployed. Previously, the instructions to deploy were:

> The `release task` creates archives and uploads them to
download.elasticsearch.org/elasticsearch/monitoring/VERSION. You will need S3
credentials in `$HOME/.aws-config.json`. Format as so:

> ```
> {
>   "key":"MY_KEY_HERE",
>   "secret":"your/long/secret/string"
> }
> ```

> To upload the current archive as the "latest" release, use:

> ```
> gulp release
> ```
