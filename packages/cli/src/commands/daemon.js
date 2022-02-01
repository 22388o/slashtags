import { program } from 'commander';
import pm2 from 'pm2';
import { homedir } from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const daemon = program.command('daemon').description('Slashtag Daemon');

daemon
  .command('start')
  .description('Run Slashtags daemon')
  .action(async (alias) => {
    const serverPath = path.join(
      fileURLToPath(import.meta.url),
      '../../',
      'server.js',
    );

    // @ts-ignore
    pm2.start(
      {
        script: serverPath,
        name: 'slashd',
        namespace: 'SLASHTAGS',
      },
      function (err, app) {
        if (err) {
          console.log({ err });
          if (err.message === 'Script already launched')
            console.log('Slash daemon is already running');
          return pm2.disconnect();
        }

        console.log('Slashtags daemon has started');
        return pm2.disconnect();
      },
    );
  });

daemon
  .command('stop')
  .description('Stop a running slashtags daemon')
  .action(async (alias) => {
    pm2.delete('slashd', function (err, app) {
      console.log('Slashtags daemon stopped');

      return pm2.disconnect();
    });
  });

// TODO: How to log errors while in daemon mode?
daemon
  .command('logs')
  .description('Show error logs')
  .action(async (alias) => {
    try {
      const path = homedir() + '/.slash/error.log';
      const data = fs.readFileSync(path, 'utf8');

      console.log('Error Logs:\n');
      data.split('\n').forEach((data) => {
        try {
          console.dir(JSON.parse(data), { depth: null });
        } catch (error) {}
      });
    } catch (error) {
      if (error.message.startsWith('ENOENT: no such file or directory'))
        console.log('No error logs found');
    }
  });
