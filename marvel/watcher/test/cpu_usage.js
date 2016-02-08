var lib = require('requirefrom')('lib');
var expect = require('expect.js');
var moment = require('moment');
var executeWatcher = lib('execute_watcher');
var client = lib('client');
var indexPattern = '[.monitoring-]YYYY.MM.DD';
lib('setup_es');
lib('setup_smtp_server');

describe('Monitoring Watchers', function () {
  describe('CPU Usage', function () {

    describe('above 75%', function () {
      var response;
      beforeEach(function () {
        this.timeout(5000);
        var fixture = {
          indexPattern: indexPattern,
          type: 'node_stats',
          duration: moment.duration(5, 's'),
          startDate: moment.utc().subtract(5, 'm'),
          data: [
            ['node.name', 'os.cpu.user'],
            ['node-01', 75],
            ['node-02', 85],
            ['node-03', 60]
          ]
        };
        return executeWatcher('cpu_usage', fixture).then(function (resp) {
          response = resp;
          return resp;
        });
      });

      it('should meet the script condition', function () {
        expect(response.state).to.be('executed');
        expect(response.execution_result.condition.script.met).to.be(true);
      });

      it('should send an email with multiple hosts', function () {
        expect(this.mailbox).to.have.length(1);
        var message = this.mailbox[0];
        expect(message.text).to.contain('"node-01" - CPU Usage is at 75.0%');
        expect(message.text).to.contain('"node-02" - CPU Usage is at 85.0%');
      });

    });

    describe('below 75%', function () {
      var response;
      beforeEach(function () {
        var self = this;
        this.timeout(5000);
        var fixture = {
          indexPattern: indexPattern,
          type: 'node_stats',
          duration: moment.duration(5, 's'),
          startDate: moment.utc().subtract(5, 'm'),
          data: [
            ['node.name', 'os.cpu.user'],
            ['node-01', 35],
            ['node-02', 25],
            ['node-03', 10]
          ]
        };
        return executeWatcher('cpu_usage', fixture).then(function (resp) {
          response = resp;
          return resp;
        });
      });

      it('should not send an email', function () {
        expect(response.state).to.be('execution_not_needed');
        expect(response.execution_result.condition.script.met).to.be(false);
        expect(this.mailbox).to.have.length(0);
      });

    });

  });
});
