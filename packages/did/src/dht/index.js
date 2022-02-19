import { DHT } from 'dht-universal';

/** @type {import ('./index').dhtPlugin}>} */
export async function dhtPlugin(instance, options) {
  const dht = await DHT.create({ relays: options.relays });
  instance.decorate('dht', dht);
  instance.onReady(() => dht.ready());
  instance.onClose(() => dht.destroy());
}

/**
 * @template T
 * @typedef {import('@synonymdev/slashtags-core/types/src/interfaces').Plugin} Plugin
 * */
