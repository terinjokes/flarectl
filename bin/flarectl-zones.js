#!/usr/bin/env node
var dashdash = require('dashdash');
var Table = require('cli-table3');
var chalk = require('chalk');
var ora = require('ora');
var CF = require('cloudflare');
exports.command = {
  description: 'View and modify account zones'
};

var options = [
  {names: ['help', 'h'], type: 'bool', help: 'Print this help and exit'},
  {names: ['name'], type: 'string', help: 'The domain name'},
  {names: ['jump-start'], type: 'bool', help: 'Jump Start DNS while adding a zone', default: false},
  {names: ['api-key'], type: 'string', help: 'CloudFlare API key', helpArg: 'KEY', env: 'FLARE_API_KEY'},
  {names: ['api-email'], type: 'string', help: 'CloudFlare API email', helpArg: 'EMAIL', env: 'FLARE_API_EMAIL'}
];

function showHelp(parser, exitCode) {
  var help = parser.help({includeEnv: true}).trimRight();
  console.log('usage: flarectl zones [COMMAND] [OPTIONS]\n' +
              'commands:\n' +
              '    browse\n' +
              '    add\n' +
              'options:\n' +
              help);
  process.exit(exitCode || 0);
}

if (require.main === module) {
  var parser = dashdash.createParser({options: options});
  var opts;

  try {
    opts = parser.parse(process.argv);
  } catch (err) {
    console.error('help: error: %s', err.message);
    process.exit(1);
  }

  if (opts.help) {
    showHelp(parser);
  }

  if (!opts._args[0]) {
    showHelp(parser, -1);
  }

  var cf = new CF({
    email: opts.api_email,
    key: opts.api_key
  });
  var spinner = ora();

  switch (opts._args[0]) {
    case 'add':
      spinner.text = 'Adding zone ' + opts.name;
      spinner.start();
      cf.addZone(CF.Zone.create({
        name: opts.name
      }), opts.jump_start).then(function (zone) {
        var table = new Table({
          head: ['id', 'name', 'plan', 'status', 'name servers']
        });

        if (zone.type === 'full') {
          table.push([
            {rowSpan: 2, content: zone.id},
            {rowSpan: 2, content: zone.name},
            {rowSpan: 2, content: zone.plan.legacy_id},
            {rowSpan: 2, content: zone.status},
            zone.nameservers[0]
          ]);
          table.push([zone.nameservers[1]]);
        } else {
          table.push([zone.id, zone.name, zone.plan.legacy_id, zone.status,
                      {hAlign: 'center', content: chalk.dim('n/a')}
                     ]);
        }

        spinner.stop();
        console.log(table.toString());
      }).catch(function (err) {
        spinner.stop();
        console.error('Error adding zone: %s', err);
        process.exit(-1);
      });
      break;
    case 'browse':
      spinner.text = 'Browsing Zones';
      spinner.start();
      cf.browseZones().then(function (results) {
        var table = new Table({
          head: ['id', 'name', 'plan', 'status', 'name servers']
        });

        var rows = results.result.reduce(function (acc, zone) {
          if (zone.type === 'full') {
            acc.push([
              {rowSpan: 2, content: zone.id},
              {rowSpan: 2, content: zone.name},
              {rowSpan: 2, content: zone.plan.legacy_id},
              {rowSpan: 2, content: zone.status},
              zone.nameservers[0]
            ]);
            acc.push([zone.nameservers[1]]);
          } else {
            acc.push([zone.id, zone.name, zone.plan.legacy_id, zone.status,
                      {hAlign: 'center', content: chalk.dim('n/a')}
                     ]);
          }

          return acc;
        }, []);

        table.push.apply(table, rows);

        spinner.stop();
        console.log(table.toString());

        if (results.total > results.perPage) {
          console.log(chalk.cyan('%d results not shown'), results.total - results.perPage);
        }
      }).catch(function (err) {
        spinner.stop();
        console.error('Error browsing zones: %s', err);
        process.exit(-1);
      });
      break;
    default:
      console.error('Unknown subcommand "%s"', opts._args[0]);
      showHelp(parser, -1);
  }
}
