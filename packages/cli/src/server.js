import { Slashtags } from './lib/core.js';
import { DIDStore } from './lib/dids.js';
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
    // try {
    const response = await didStore.addService(did, service);
    return response;
    // } catch (error) {
    // console.log(error);
    // }
  });

  const addr = await app.listen(8080);
  console.log('listening', addr);
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
