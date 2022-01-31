import { program } from 'commander';
import inquirer from 'inquirer';
import { printTable } from 'console-table-printer';
import { Slashtags } from './lib/core.js';
import { DIDStore } from './lib/dids.js';

const daemon = program.command('daemon').description('Slashtag Daemon');

daemon
  .command('start')
  .description('Create a new slashtags DID')
  .action(async (alias) => {
    const node = new Slashtags();
    await new DIDStore({ node }).init();
    console.log('Slashtags Daemon is running...');
  });
