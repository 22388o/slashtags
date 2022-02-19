import { Slashtags } from './lib/sdk.js';
import { DIDStore } from './lib/dids/index.js';
import fastify from 'fastify';
import { homedir } from 'os';
import fs from 'fs';
import path from 'path';

const setup = async () => {
  const node = new Slashtags();
  const didStore = await new DIDStore({ node }).init();
  didStore.seedLocalDIDs();

  const app = fastify({
    logger: { level: 'error', file: homedir() + '/.slash/error.log' },
  });

  app.get('/did/list', async (request, reply) => {
    const response = await didStore.ls();
    return response;
  });

  app.post('/did/create', async (request, reply) => {
    const { alias } = request.body;
    const response = await didStore.createDID(alias);
    return response;
  });

  app.get('/did/resolve/:didUri', async (request, reply) => {
    const response = await didStore.resolve(request.params.didUri);
    return response;
  });

  app.post('/did/add-service', async (request, reply) => {
    const { did, service } = request.body;
    const response = await didStore.addService(did, service);
    return response;
  });

  const addr = await app.listen(8080);
};

// Ensure error.log exists first
fs.writeFile(
  path.join(homedir() + '/.slash/error.log'),
  '',
  { flag: 'wx' },
  function (err) {
    setup();
  },
);
