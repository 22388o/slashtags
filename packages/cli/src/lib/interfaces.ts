import { ServiceEndpoint } from 'did-resolver';

export enum publicKeyPurposes {
  Authentication = 'authentication',
  AssertionMethod = 'assertionMethod',
  CapabilityInvocation = 'capabilityInvocation',
  CapabilityDelegation = 'capabilityDelegation',
  KeyAgreement = 'keyAgreement',
}

export type SlashDIDPublicKey = {
  id: string;
  type: string;
  publicKeyMultibase: string;
  purposes?: publicKeyPurposes[];
};

export type SlashDIDContent = {
  publicKeys?: SlashDIDPublicKey[];
  services?: ServiceEndpoint[];
};
