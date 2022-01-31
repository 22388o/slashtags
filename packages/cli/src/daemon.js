import { program } from 'commander';
import inquirer from 'inquirer';
import { printTable } from 'console-table-printer';
import { Slashtags } from './lib/core.js';

const daemon = program.command('daemon').description('Slashtag daemon');

let slash;

daemon
  .command('start')
  .description('Start a Slashtags daemon')
  .action(async (cmd) => {
    slash = await new Slashtags().ready();

    console.log('Running daemon...');
  });

// daemon
//   .command('stop')
//   .description('Close running Slashtags daemon')
//   .action(async (cmd) => {
//     if (!slash) {
//       console.log('No daemon running');
//       return;
//     }

//     console.log('Closing daemon...');

//     await slash.close();

//     console.log('Daemon closed.');
//   });
