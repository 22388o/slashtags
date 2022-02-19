import { expect } from 'aegir/utils/chai.js';
import { Resolver } from 'did-resolver';
import { getResolver, resolve } from '../src/resolver.js';
import { HyperSDK } from '../src/hyper/index.js';

describe('resolver', () => {
  it('should provide a slashtags did resolver registry', async () => {
    const sdk = await new HyperSDK({ persist: false }).init();

    const resolver = new Resolver({ ...getResolver(sdk) });

    const result = await resolver.resolve(
      'did:slashtags:0x0000000000000000000000000000000000000000',
    );

    expect(result).to.be.an('object');

    sdk.close();
  });
});
