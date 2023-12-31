import { config } from './config.js'; //Generate this with `npx prisma generate`
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { ping } from '@libp2p/ping';
import { plaintext } from '@libp2p/plaintext';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { mdns } from '@libp2p/mdns';
import { multiaddr } from '@multiformats/multiaddr';
import { peerIdFromString } from '@libp2p/peer-id';


const libp2pNode = await createLibp2p({
  addresses: {
    listen: [`/ip4/${config.host}/tcp/${config.port}`],
  },
  transports: [tcp()],
  connectionEncryption: [noise(), plaintext()],
  streamMuxers: [mplex()],
  services: {
    pubsub: gossipsub({
      // allowPublishToZeroPeers: true,
      // allowedTopics: Object.values(config.tier2Nodes).map((node) => node.did),
      directPeers: Object.values(config.tier2Nodes).map((node) => ({
        id: peerIdFromString(multiaddr(node.path).getPeerId()),
        addrs: [multiaddr(node.path)],
      })),
    }),
    ping: ping({
      protocolPrefix: 'ipfs', // default
    }),
  },
  peerId: config.libp2pPeerId,
  peerDiscovery: [mdns()]
});

libp2pNode.services.pubsub.addEventListener('message', (message) => {
  console.log('received message, raw:', message);

  const { did } = message.detail;
  if(!did) {
    console.log('received message with no topic, ignoring');
    return;
  }
  if(!config.tier2Nodes[did]){
    console.log('received message from someone other than tier2, ignoring');
    return;
  }

  const { detail } = message.detail;
  console.log();
  console.log(`${message.detail.topic}:`, new TextDecoder().decode(message.detail.data));
});

libp2pNode.services.pubsub.addEventListener('subscription-change', (message) => {
  console.log('subscription-change:', message);
  console.log(libp2pNode.services.pubsub.getTopics());
  console.log(libp2pNode.services.pubsub.getPeers());
  console.log(libp2pNode.services.pubsub.getSubscribers(config.did));
})
libp2pNode.services.pubsub.addEventListener("gossipsub:heartbeat", (message) => {
  // console.log("heartbeat", message);
})
libp2pNode.services.pubsub.addEventListener("gossipsub:message", (message) => {
  console.log("gossipSub:message", message);
})


await libp2pNode.start();
libp2pNode.services.pubsub.subscribe(config.did);

// libp2pNode.services.pubsub.publish(config.did, new TextEncoder().encode('banana'));

// print out listening addresses
console.log('libp2p listening on addresses:');
libp2pNode.getMultiaddrs().forEach((addr) => {
  console.log(addr.toString());
});


const listeners = ['SIGINT', 'SIGTERM'];
listeners.forEach((signal) => {
  process.on(signal, async () => {
    await libp2pNode.stop();
    process.exit(0);
  });
});


