import { program } from 'commander';
import inquirer from 'inquirer';
import { printTable } from 'console-table-printer';
import { Slashtags } from './lib/core.js';
import { SlashDID, DIDStore } from './lib/dids.js';

const did = program.command('did').description('Slashtag DIDs');

did
  .command('create')
  .description('Create a new slashtags DID')
  .action(async (cmd) => {
    const node = new Slashtags();
    const didManager = await new DIDStore({ node }).ready();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'alias',
        message: 'Enter alias',
      },
    ]);

    let did;

    if (didManager.dids.has(answers.alias)) {
      console.log('DID already exists: ');
      did = didManager.dids.get(answers.alias);
    } else {
      did = await didManager.createDID(answers.alias);
      console.log('Created aliased DID: ');
    }

    printTable([
      {
        alias: answers.alias,
        did: did.uri,
      },
    ]);

    // await node.close();
  });

did
  .command('list')
  .description('List managed Slashtags DIDs')
  .action(async (cmd) => {
    const node = new Slashtags();
    const didStore = await new DIDStore({ node }).ready();

    if (didStore.dids.size === 0) {
      console.log('No DIDs found');
    } else {
      printTable(
        Array.from(didStore.dids.entries()).map(([alias, did]) => ({
          alias,
          did: did.uri,
        })),
      );
    }

    node.close();
  });

did
  .command('resolve <didUrl>')
  .description('Resolve a slashtags DID Document')
  .action(async (didUri) => {
    const node = await new Slashtags({ persist: true }).ready();

    const { slash: resolve } = SlashDID.getResolver(node);

    const doc = await resolve(didUri);

    console.dir(doc, { depth: null });

    // slash.close();
  });
