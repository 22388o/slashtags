import type { Plugin } from '@synonymdev/slashtags-core/types/src/interfaces';

interface PluginOptions {
  relays: string[];
}

export interface DHT {}

declare module '@synonymdev/slashtags-core/types/src/interfaces' {
  interface Slashtags {
    dht: DHT;
  }
}

export const dhtPlugin: Plugin<PluginOptions>;

export default dhtPlugin;
