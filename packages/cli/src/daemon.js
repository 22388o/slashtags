import { program } from 'commander';
import inquirer from 'inquirer';
import { printTable } from 'console-table-printer';
import { Slashtags } from './lib/core.js';
import { DIDStore } from './lib/dids.js';
import fastify from 'fastify';

const daemon = program.command('daemon').description('Slashtag Daemon');

let app;

daemon
  .command('start')
  .description('Create a new slashtags DID')
  .action(async (alias) => {
    await setup();
    console.log('Slashtags Daemon is running on port 8080...');
  });

async function setup() {
  const node = new Slashtags();
  const didStore = await new DIDStore({ node }).init();
  didStore.seedLocalDIDs();

  app = fastify();

  app.get('/did/list', async (request, reply) => {
    return didStore.ls();
  });

  app.post('/did/create', async (request, reply) => {
    const { alias } = request.body;
    return didStore.createDID(alias);
  });

  app.get('/did/resolve/:didUri', async (request, reply) => {
    const foo = didStore.resolve(request.params.didUri);
    return foo;
  });

  app.post('/did/add-service', async (request, reply) => {
    const { did, service } = request.body;
    return didStore.addService(did, service);
  });

  return app.listen(8080);
}
