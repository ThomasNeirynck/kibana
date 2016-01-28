var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var Promise = require('bluebird');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var gulp = require('gulp');
var g = require('gulp-load-plugins')();

var pkg = require('./package.json');
var packageName = pkg.name  + '-' + pkg.version;
var buildTarget = path.resolve(__dirname, 'build');

var ignoredPlugins = [
  path.basename(__dirname),
];

var plugins = getPlugins();
var templateData = {
  plugins: plugins,
  name: pkg.packageName,
  version: pkg.version,
  author: pkg.author,
};

gulp.task('build', ['prepare-builds'], runBuild);

gulp.task('buildOnly', runBuild);

gulp.task('package', ['build'], function () {

});

gulp.task('prepare-builds', function () {
  return Promise.mapSeries(plugins, function (plugin) {
    var modules = path.resolve(plugin.path, 'node_modules');
    g.util.log(g.util.colors.cyan(plugin.name), 'Preparing for build, this will take a moment');

    return Promise.fromCallback(function (cb) {
      rimraf(modules, cb);
    })
    .then(function () {
      return exec(plugin.name, 'npm', ['install', '--silent'], { cwd: plugin.path })
    });
  });
});

function runBuild() {
  return Promise.fromCallback(function (cb) {
    rimraf(buildTarget, cb);
  })
  .then(function () {
    return Promise.fromCallback(function (cb) {
      mkdirp(buildTarget, cb);
    });
  })
  .then(function () {
    return Promise.mapSeries(plugins, function (plugin) {
      g.util.log(g.util.colors.cyan(plugin.name), 'Building');
      return exec(plugin.name, 'npm', ['run', 'build'], { cwd: plugin.path })
      .then(function () {
        return Promise.fromCallback(function (cb) {
          var buildPath = path.resolve(plugin.path, 'build');

          var stream = gulp.src(path.join(buildPath, '**'))
          .pipe(gulp.dest(buildTarget));

          stream.on('finish', cb);
        })
      });
    })
    .then(createEntry);
  });
}

function createEntry() {
  return Promise.fromCallback(function (cb) {
    var templatePath = path.resolve(__dirname, 'templates');
    var s = gulp.src(path.join(templatePath, '*.*'))
    .pipe(g.template(templateData))
    .pipe(gulp.dest(buildTarget))
    .on('finish', cb)
    .on('error', cb);
  });
}

function getPlugins() {
  var plugins = fs.readdirSync('..')
  .map(function (item) {
    if (~ignoredPlugins.indexOf(item) < 0) return false;

    var filepath = path.resolve(__dirname, '..', item);
    var stats = fs.lstatSync(filepath);
    return !stats.isDirectory() ? false : {
      name: item,
      path: filepath,
    };
  })
  .filter(Boolean);

  return plugins;
}

function exec(prefix, cmd, args, opts) {
  args = args || [];
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    var proc = child_process.spawn(cmd, args, opts);

    proc.stdout.on('data', function (data) {
      // g.util.log(g.util.colors.green(prefix), data.toString('utf-8').trim());
    });

    proc.stderr.on('data', function (data) {
      g.util.log(g.util.colors.red(prefix), data.toString('utf-8').trim());
    });

    proc.on('error', function (err) {
      reject(err);
    });

    proc.on('close', function (code) {
      if (code !== 0) reject(new Error('Process exited with code ' + code));
      resolve();
    });
  });
}
