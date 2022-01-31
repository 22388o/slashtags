import { program } from 'commander';
import inquirer from 'inquirer';
import { printTable } from 'console-table-printer';
import { Slashtags } from './lib/core.js';
import { DIDStore } from './lib/dids.js';

const did = program.command('did').description('Slashtag DIDs');

did
  .command('create <alias>')
  .description('Create a new slashtags DID')
  .action(async (alias) => {
    const node = new Slashtags();
    const didManager = await new DIDStore({ node }).init();

    let did;

    if (didManager.aliases.has(alias)) {
      console.log('DID already exists: ');
      did = didManager.aliases.get(alias);
    } else {
      did = await didManager.createDID(alias);
      console.log('Created aliased DID: ');
    }

    printTable([{ alias: alias, did: did.uri }]);

    await node.close();
  });

did
  .command('list')
  .description('List managed Slashtags DIDs')
  .action(async (cmd) => {
    const node = new Slashtags();
    const didStore = await new DIDStore({ node }).init();

    const aliases = await didStore.ls();

    if (aliases.size === 0) {
      console.log('No DIDs found');
    } else {
      printTable(
        Array.from(aliases.entries()).map(([alias, did]) => ({
          alias,
          did: did.uri,
        })),
      );
    }

    node.close();
  });

did
  .command('resolve <didUri>')
  .description('Resolve a slashtags DID Document')
  .action(async (didUri) => {
    const node = new Slashtags({ persist: false });
    const didStore = await new DIDStore({ node }).init();

    console.log('Resolving DID, this can take few seconds...');

    const doc = await didStore.resolve(didUri);

    console.dir(doc, { depth: null });

    node.close();
  });
