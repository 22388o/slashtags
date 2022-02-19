import { expect } from 'aegir/utils/chai.js';
import { slashtags } from '@synonymdev/slashtags-core';
import { dhtPlugin } from '../src/dht/index.js';

describe.only('dhtPlugin', () => {
  it('', async () => {
    const slash = await slashtags().use(dhtPlugin).ready();
    console.log(slash.close.toString());

    slash.close();
  });
});
