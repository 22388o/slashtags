declare module 'b4a' {
  function toString(
    buf: Buffer | Uint8Array,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  ): string;
  function isBuffer(value: any): boolean;
  function from(
    buf: Buffer | Uint8Array | string,
    encoding?: 'hex' | 'base64' | 'utf8' | 'utf16le' | 'ascii',
  );
}
