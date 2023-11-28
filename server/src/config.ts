import os from 'os';
import {
  RtpCodecCapability,
  TransportListenIp,
  WebRtcTransportOptions,
  WorkerLogTag,
} from 'mediasoup/node/lib/types';

const config = {
  mediasoup: {
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'debug',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'] as WorkerLogTag[],
      path: 'mediasoup-worker',
    },
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
          },
        },
      ] as RtpCodecCapability[],
    },
    webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: '127.0.0.1', // Will be replace by a public ip address
        },
      ] as TransportListenIp[],
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxIncomingBitrate: 1500000,
    },
  },
} as const; // infers the type of config as it is initialized (Which means it cannot be changed)

export default config;

// const config = {
//   mediasoup: {
//     // Worker settings
//     worker: {
//       rtcMinPort: 10000,
//       rtcMaxPort: 10100,
//       logLevel: "warn",
//       logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
//       // Specify the path to the mediasoup worker executable
//       // When running in production, this should be set to an absolute path
//       // to the worker executable file
//       // When running in development, you can use the default path
//       // which is "mediasoup-worker"
//       // Example:
//       // path: "/usr/local/bin/mediasoup-worker"
//       path: "mediasoup-worker",
//       // Specify the number of mediasoup workers to spawn
//       // This should be set to the number of CPU cores available
//       // on your server
//       // Example:
//       // numWorkers: 2
//       numWorkers: 1,
//     },
//     // Router settings
//     router: {
//       // Specify the media codecs that the router will support
//       // This should be set to the codecs that your clients will use
//       // Example:
//       // mediaCodecs: [
//       //   {
//       //     kind: "audio",
//       //     mimeType: "audio/opus",
//       //     clockRate: 48000,
//       //     channels: 2,
//       //   },
//       //   {
//       //     kind: "video",
//       //     mimeType: "video/VP8",
//       //     clockRate: 90000,
//       //     parameters: {
//       //       "x-google-start-bitrate": 1000,
//       //     },
//       //   },
//       // ],
//       mediaCodecs: [
//         {
//           kind: "audio",
//           mimeType: "audio/opus",
//           clockRate: 48000,
//           channels: 2,
//         },
//         {
//           kind: "video",
//           mimeType: "video/VP8",
//           clockRate: 90000,
//         },
//       ],
//     },
//     // WebRtcTransport settings
//     webRtcTransport: {
//       listenIps: [{ ip: "0.0.0.0", announcedIp: null }],
//       maxIncomingBitrate: 1500000,
//       initialAvailableOutgoingBitrate: 1000000,
//       minimumAvailableOutgoingBitrate: 600000,
//       enableUdp: true,
//       enableTcp: true,
//       preferUdp: true,
//       enableSctp: false,
//       numSctpStreams: {
//         OS: 1024,
//         MIS: 1024,
//       },
//       // Specify additional options for the WebRtcTransport
//       // Example:
//       // additionalSettings: {
//       //   maxSctpMessageSize: 262144,
//       // },
//       additionalSettings: {},
//     } as WebRtcTransportOptions,
//   },
// };

// export default config;
