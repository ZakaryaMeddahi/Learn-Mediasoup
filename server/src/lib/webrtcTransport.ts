import { WebRtcTransport, Router } from 'mediasoup/node/lib/types';
import config from '../config';

// Create a new WebRtcTransport instance
const createWebrtcTransport = async (mediasoupRouter: Router) => {
  const { maxIncomingBitrate, initialAvailableOutgoingBitrate } =
    config.mediasoup.webRtcTransport;

  const transport = await mediasoupRouter.createWebRtcTransport({
    listenIps: config.mediasoup.webRtcTransport.listenIps,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate,
  });

  if (maxIncomingBitrate) {
    try {
      await transport.setMaxIncomingBitrate(maxIncomingBitrate);
    } catch (error) {
      console.error(error);
    }
  }

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    },
  };

  // const transport = new WebRtcTransport({
  //   listenIps: [{ ip: '0.0.0.0', announcedIp: null }], // Set the listening IP address
  //   enableUdp: true, // Enable UDP
  //   enableTcp: true, // Enable TCP
  //   preferUdp: true, // Prefer UDP over TCP
  //   maxIncomingBitrate: 1500000, // Set the maximum incoming bitrate
  //   initialAvailableOutgoingBitrate: 1000000, // Set the initial available outgoing bitrate
  // });
};

// Export the transport
export default createWebrtcTransport;
