import type { ServiceEndpoint, KeyCapabilitySection } from 'did-resolver';

export type SlashDIDPublicKey = {
  id: string;
  type: string;
  publicKeyMultibase: string;
  purposes?: KeyCapabilitySection[];
};

export type SlashDIDContent = {
  p?: SlashDIDPublicKey[];
  s?: ServiceEndpoint[];
};
