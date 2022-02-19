import c from 'compact-encoding';
import {
  getHeader,
  compile,
  opt,
  array,
  flag,
  constant,
} from 'compact-encoding-struct';
import b4a from 'b4a';

const ServiceTypes = {
  PersonalDataStore: 'PersonalDataStore',
  LinkedDomain: 'LinkedDomain',
  Email: 'Email',
};

// 0x00 >= byte <= 0x7f
const ServiceType2Byte = {
  PersonalDataStore: 0x00,
  LinkedDomain: 0x01,
  Email: 0x02,
};

const ServiceByte2Type = Object.fromEntries(
  Object.entries(ServiceType2Byte).map(([k, v]) => [v, k]),
);

const ServiceType = {
  preencode(state, type) {
    state.end += 1;
    if (ServiceType2Byte[type] === undefined) state.end += b4a.byteLength(type);
  },
  encode(state, type) {
    const bytes = ServiceType2Byte[type];

    if (bytes !== undefined) {
      state.buffer[state.start++] = bytes;
    } else {
      // Type is not a registered service type, so we encode it as a string.
      let len = b4a.byteLength(type);
      if (len > 0x80) throw new Error('Service type too long');
      state.buffer[state.start++] = 0x80 + len;

      b4a.write(state.buffer, type, state.start);
      state.start += len;
    }
  },
  decode(state) {
    if (state.start >= state.end) throw new Error('Out of bounds');
    const byte = state.buffer[state.start++];
    if (byte >= 0x80) {
      // Type is not a registered type, so we decode it as a string.
      const len = byte - 0x80;
      if (state.end - state.start < len) throw new Error('Out of bounds');
      return b4a.toString(
        state.buffer,
        'utf-8',
        state.start,
        (state.start += len),
      );
    } else {
      return ServiceByte2Type[byte];
    }
  },
};

const Service = compile({
  id: c.string,
  type: ServiceType,
  serviceEndpoint: c.string,
});

const PublicKey = compile({
  id: c.string,
  type: c.string,
  key: c.string,
  authentication: flag,
  assertionMethod: flag,
  keyAgreement: flag,
  capabilityInvocation: flag,
  capabilityDelegation: flag,
});

const BlockStruct = {
  services: opt(c.array(Service)),
  publicKeys: opt(c.array(PublicKey)),
  deactivated: flag,
};

export const DIDBlock = compile(BlockStruct);
