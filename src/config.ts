// config.ts prepares the global config object
// The global config object is loaded with envvars and contains signing info, DID details, and database connection info
import {ethers} from "ethers";
import dotenv from 'dotenv';
import * as didJWT from 'did-jwt';
import { peerIdFromKeys } from '@libp2p/peer-id';

dotenv.config();

type NodeDefinition = {
    did: string;
    path: string;
}

export type Config = {
    privateKey: string; // Your ethereum wallet private key, must be provided for the application to start
    publicKey: string; // Your ethereum wallet address
    did: string; // Your DID, which will be generated as "did:pkh:eip155:1:<your-address>"
    wallet: ethers.Wallet; // Convenience property, ether wallet loaded with your private key ready to use
    // databaseUrl: string; // The URL of the database to connect to
    didJwtSigner: didJWT.Signer; // The signer used to sign JWTs
    tier2Nodes: { [key: string]: NodeDefinition }; // The Tier 2 nodes to connect to, TODO for now this is hardcoded, see below
    host: string; // The host to run the server on
    port: number; // The port to run the server on
    libp2pPeerId: any; // The private key of the node
}

const requireVarSet = (envvar: string) => {
    const v = process.env[envvar];
    if (!v) {
        throw new Error(`Missing required environment variable ${envvar}`);
    }
    return v
}

//Load ether private key early because we use it in multiple config elements
const etherPrivateKey = requireVarSet("PRIVATE_KEY")
const wallet = new ethers.Wallet(etherPrivateKey)


const peerIdPriv = Buffer.from(requireVarSet("LIBP2P_PRIVATE_KEY"), 'base64');
const peerIdPub = Buffer.from(requireVarSet("LIBP2P_PUBLIC_KEY"), 'base64');


// If the user MUST submit an envvar, use requireVarSet, which will throw an error if the envvar is empty or missing
// If the user can optionally submit an envvar, use process.env["ENVVAR"] || "default value"
// Generated values, like did, wallet, and publicKey, can be assigned directly to object properties
// All config below MUST have been validated before being assigned (see tier1 endpoint for example).
// You can do validations in the code leading up to this config object declaration
export const config: Config = {
    privateKey: etherPrivateKey,
    publicKey: wallet.address,
    did: "did:pkh:eip155:1:" + wallet.address,
    wallet: new ethers.Wallet(requireVarSet("PRIVATE_KEY")),
    // databaseUrl: requireVarSet("DATABASE_URL"),
    didJwtSigner: didJWT.ES256KSigner(didJWT.hexToBytes(etherPrivateKey)),
    port: parseInt(process.env.PORT) || 5001,
    host: process.env.HOST || "0.0.0.0",
    tier2Nodes: {
        "did:pkh:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": {
            did: "did:pkh:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            path: "/ip4/127.0.0.1/tcp/4002/p2p/16Uiu2HAkxUuQPdJ1bqZ3MiF3onkLmReapDgdENBgREzkuQbWhgLr"
        }
    },
    libp2pPeerId: await peerIdFromKeys(peerIdPub, peerIdPriv),
}

console.log("finished loading config", config)