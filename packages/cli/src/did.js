import { program } from 'commander';
import inquirer from 'inquirer';
import { printTable } from 'console-table-printer';
import { Slashtags } from './lib/core.js';
import { DIDStore } from './lib/dids.js';
import _fetch from 'node-fetch';

const did = program.command('did').description('Slashtag DIDs');

did
  .command('create <alias>')
  .description('Create a new slashtags DID')
  .action(async (alias) => {
    const response = await fetch('create', {
      method: 'post',
      body: JSON.stringify({ alias }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response) return;

    const { did, created } = response;

    created
      ? console.log('Created aliased DID: ')
      : console.log('DID already exists: ');

    printTable([{ alias, did }]);
  });

did
  .command('list')
  .description('List managed Slashtags DIDs')
  .action(async (cmd) => {
    const aliases = await fetch('list');

    if (!aliases) return;

    aliases.length === 0
      ? console.log('No DIDs found')
      : printTable(
          aliases.map(([alias, didUri]) => ({
            alias,
            did: didUri,
          })),
        );
  });

did
  .command('resolve <didUri>')
  .description('Resolve a slashtags DID Document')
  .action(async (didUri) => {
    console.log('Resolving DID, this can take few seconds...');
    const doc = await fetch('resolve/' + didUri);
    console.dir(doc, { depth: null });
  });

did
  .command('add-service')
  .description('add a service endpoint to did document')
  .action(async (cmd) => {
    const list = await fetch('list');
    if (!list) return;

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'did',
        choices: list.map((item) => item[1]),
        message: 'Select DID',
      },
      {
        type: 'text',
        name: 'type',
        message: 'Service type',
        default: 'PersonalDataStore',
      },
      {
        type: 'text',
        name: 'endpoint',
        message: 'Endpoint',
      },
      {
        type: 'text',
        name: 'id',
        message: 'ID',
      },
    ]);

    await fetch('add-service', {
      method: 'post',
      body: JSON.stringify({
        did: answers.did,
        service: {
          type: answers.type,
          serviceEndpoint: answers.endpoint,
          id: answers.id,
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const newState = await fetch('resolve/' + answers.did);

    console.log('\nAdded a service to the did document:\n');
    console.dir(newState, { depth: null });
  });

async function fetch(url, options) {
  try {
    const response = await _fetch('http://127.0.0.1:8080/did/' + url, options);

    if (!response.ok) {
      const error = new Error(response.statusText);
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'FetchError')
      console.log(`The daemon is not active. Please run:

  slash daemon start
      `);
  }
}
