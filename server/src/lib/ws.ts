import {
  Consumer,
  Producer,
  Router,
  RtpCapabilities,
  Transport,
} from 'mediasoup/node/lib/types';
import createWorker from './worker';
import WebSocket from 'ws';
import createWebrtcTransport from './webrtcTransport';

let mediasoupRouter: Router;
let producerTransport: Transport;
let consumerTransport: Transport;
let producer: Producer;
let consumer: Consumer;

const websocketConnection = async (websocket: WebSocket.Server) => {
  try {
    mediasoupRouter = await createWorker();
  } catch (error) {
    throw error;
  }

  websocket.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    ws.on('message', (message: string) => {
      const event = JSON.parse(message);
      console.log(event);
      // ws.send(JSON.stringify(data));
      switch (event.type) {
        case 'getRouterRtpCapabilities':
          onRouterRtpCapabilities(event, ws);
          break;
        case 'createProducerTransport':
          onCreateProducerTransport(event, ws);
          break;
        case 'connectProducerTransport':
          onConnectProducerTransport(event, ws);
          break;
        case 'produce':
          console.log('Produce...........................');
          onProduce(event, ws, websocket);
          break;
        case 'createConsumerTransport':
          console.log('createConsumerTransport');
          onCreateConsumerTransport(event, ws);
          break;
        case 'connectConsumerTransport':
          console.log('connectConsumerTransport');
          onConnectConsumerTransport(event, ws);
          break;
        case 'resume':
          console.log('resume');
          onResume(ws);
          break;
        case 'consume':
          console.log('consume');
          onConsume(event, ws);
          break;
        default:
          break;
      }
    });
  });

  const onRouterRtpCapabilities = (event: string, ws: WebSocket) => {
    send<RtpCapabilities>(
      ws,
      'routerCapabilities',
      mediasoupRouter.rtpCapabilities
    );
  };

  const onCreateProducerTransport = async (event: string, ws: WebSocket) => {
    try {
      const { transport, params } = await createWebrtcTransport(
        mediasoupRouter
      );
      producerTransport = transport;
      send(ws, 'producerTransportCreated', params);
    } catch (error) {
      console.error(error);
      send(ws, 'Error', error);
    }
  };

  const onConnectProducerTransport = async (event: any, ws: WebSocket) => {
    try {
      await producerTransport.connect({ dtlsParameters: event.dtlsParameters });
      send<string>(ws, 'producerConnected', 'Producer Transport Connected!');
      console.log('producerConnected');
    } catch (error) {
      console.error(error);
      send(ws, 'Error', error);
    }
  };

  const onProduce = async (
    event: any,
    ws: WebSocket,
    websocket: WebSocket.Server
  ) => {
    console.log('onProduce', event);
    const { kind, rtpParameters } = event;
    producer = await producerTransport.produce({
      kind,
      rtpParameters,
    });

    const response = {
      id: producer.id,
    };
    send<{ id: string }>(ws, 'produced', response);
    broadcast<string>(websocket, 'newProducer', 'new user');
  };

  const onCreateConsumerTransport = async (event: string, ws: WebSocket) => {
    try {
      const { transport, params } = await createWebrtcTransport(
        mediasoupRouter
      );
      consumerTransport = transport;
      send(ws, 'consumerTransportCreated', params);
    } catch (error) {
      console.error(error);
      send(ws, 'Error', error);
    }
  };

  const onConnectConsumerTransport = async (event: any, ws: WebSocket) => {
    try {
      await consumerTransport.connect({ dtlsParameters: event.dtlsParameters });
      send<string>(ws, 'consumerConnected', 'Consumer Transport Connected!');
      console.log('consumerConnected');
    } catch (error) {
      console.error(error);
      send(ws, 'Error', error);
    }
  };

  const onResume = async (ws: WebSocket) => {
    try {
      console.log('onResume');
      await consumer.resume();
      console.log(`WS: ${ws}`);

      // ws.send(JSON.stringify(message));
      send<string>(ws, 'resumed', 'resumed');
    } catch (error) {
      console.error(error);
      send(ws, 'Error', error);
    }
  };

  const onConsume = async (event: any, ws: WebSocket) => {
    try {
      console.log('onConsume', event);
      const { rtpCapabilities } = event;
      const message = await createConsumer(producer, rtpCapabilities);
      send<any>(ws, 'subscribed', message);
    } catch (error) {
      console.error(error);
      send(ws, 'Error', error);
    }
  };

  const send = <T>(ws: WebSocket, type: string, msg: T) => {
    const message = {
      type,
      data: msg,
    };
    console.log(`WS: ${ws}`);

    ws.send(JSON.stringify(message));
  };

  const broadcast = <T>(ws: WebSocket.Server, type: string, msg: T) => {
    console.log('broadcast');
    const message = {
      type,
      data: msg,
    };
    const response = JSON.stringify(message);
    ws.clients.forEach((client) => {
      client.send(response);
    });
  };

  const createConsumer = async (
    producer: Producer,
    rtpCapabilities: RtpCapabilities
  ) => {
    if (
      !mediasoupRouter.canConsume({
        producerId: producer.id,
        rtpCapabilities,
      })
    ) {
      console.error('Can not consume');
      return;
    }

    try {
      consumer = await consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: producer.kind === 'video',
      });
    } catch (error) {
      console.error('consume failed!' + error);
      return;
    }

    return {
      producerId: producer.id,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
    };
  };
};

export default websocketConnection;
