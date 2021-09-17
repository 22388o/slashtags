// @ts-nocheck
// Separate from the client side, provides key management and attestation.
import { createAuth } from '@synonymdev/slashtags-auth';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import * as SlashtagsURL from '@synonymdev/slashtags-url';
import { useState, useEffect } from 'react';
import bint from 'bint8array';

// Alreayd in the wallet
/** @type {string} */
let username;
/** @type {import('@synonymdev/slashtags-auth/dist/types/interfaces').KeyPair} */
let userKeyPair;
/** @type {import('@synonymdev/slashtags-auth/dist/types/interfaces').Initiator} */
let initiator;

/**
 * @param {string} seed
 */
export const setUser = (seed) => {
  username = seed;
  userKeyPair = curve.generateSeedKeyPair(seed);

  const { initiator: init } = createAuth(userKeyPair, {
    metadata: { preferred_name: username },
  });

  initiator = init;
};

/**
 *
 * @param {object} param
 * @param {string} param.actionURL
 * @returns
 */
export const Wallet = ({ actionURL }) => {
  const [authPayload, setAuthPayload] = useState();
  const [server, setServer] = useState(false);

  const signIn = async () => {
    const { attestation, verifyResponder } = initiator.signChallenge(
      bint.fromString(authPayload.challenge, 'hex'),
    );

    const url = new URL(authPayload.cbURL);
    url.searchParams.set(
      'attestation',
      Buffer.from(attestation).toString('hex'),
    );
    const res = await fetch(url.toString());
    const { responderAttestation } = await res.json();

    const { responderPK, metadata } = verifyResponder(
      Buffer.from(responderAttestation, 'hex'),
    );

    setAuthPayload(null);
    setServer({
      verified: true,
      metadata,
      responderPK: Buffer.from(responderPK).toString('hex'),
    });
  };

  useEffect(() => {
    // Handle incoming action urls
    (async () => {
      if (!actionURL) return;

      try {
        const { actionID, payload } = SlashtagsURL.parse(actionURL);

        switch (actionID) {
          case 'b2iaqaamaaqjcbw5htiftuksya3xkgxzzhrqwz4qtk6oxn7u74l23t2fthlnx3ked':
            setAuthPayload(payload);
            break;

          default:
            setAuthPayload(null);
            return;
        }
      } catch (error) {
        console.warn('invlaid actionURL url');
      }
    })();
  }, [actionURL]);

  return (
    <div className="container">
      <h1>Wallet</h1>
      <div id="wallet">
        <h4>Wallet owner:</h4>
        <p>Name: {username} </p>
        <br />
        <p>Public key:</p>
        <pre>{userKeyPair?.publicKey.toString('hex')}</pre>
        <br />
        <br />
        {authPayload && (
          <>
            <h3>Login request</h3>
            <p>Do you want to login to:</p>
            <pre>{authPayload.remotePK}</pre>
            <p>by signing their challenge</p>
            <pre>{authPayload.challenge}</pre>
            <button className="btn signin" onClick={signIn}>
              Sign in
            </button>
          </>
        )}
        {server?.verified && (
          <>
            <h3>Successfully logged in to</h3>
            <pre>{server.responderPK}</pre>
            <pre>{JSON.stringify(server.metadata)}</pre>
            <button className="btn" onClick={() => setServer(false)}>
              {'< Back'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
