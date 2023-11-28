import { useEffect } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import './App.css';

function App() {
  useEffect(() => {
    const localVideo = document.getElementById('local-video');
    const remoteVideo = document.getElementById('remote-video');
    const startButton = document.getElementById('start-button');
    // const stopButton = document.getElementById('stop-button');
    const camButton = document.getElementById('cam-button');
    const screenButton = document.getElementById('screen-button');
    // const textPublish = document.getElementById('text-publish');
    // const joinButton = document.getElementById('join-button');
    // const leaveButton = document.getElementById('leave-button');
    // const shareButton = document.getElementById('share-button');
    // const stopShareButton = document.getElementById('stop-share-button');

    let textPublish, textWebcam, textScreen, isWebcam;
    let socket, device;
    let localStream, remoteStream, producer;
    let consumeTransport;

    const connect = () => {
      socket = new WebSocket('ws://localhost:3000');
      socket.onopen = () => {
        console.log('connected');
        const msg = {
          type: 'getRouterRtpCapabilities',
        };
        socket.send(JSON.stringify(msg));
      };
      socket.onmessage = (event) => {
        const response = JSON.parse(event.data);
        console.log(response);
        switch (response.type) {
          case 'routerCapabilities':
            console.log('routerCapabilities');
            onRouterCapabilities(response);
            break;
          case 'producerTransportCreated':
            console.log('ProducerTransportCreated');
            onProducerTransportCreated(response);
            break;
          case 'consumerTransportCreated':
            console.log('ConsumerTransportCreated');
            onConsumerTransportCreated(response);
            break;
          case 'resumed':
            console.log('resumed');
            console.log(event.data);
            break;
          case 'subscribed':
            console.log('subscribed');
            onSubscribed(response);
            break;
          default:
            break;
        }
      };
      // socket.onclose = () => {
      //   console.log('disconnected');
      // };

      const onRouterCapabilities = (event) => {
        loadDevice(event.data);
        // disable Button Screen and Cam Button
      };

      const onProducerTransportCreated = async (event) => {
        if (event.error) {
          console.error('Producer Transport Create Error' + event.error);
          return;
        }

        const transport = device.createSendTransport(event.data);
        console.log('Produce: ', transport);

        transport.on('connect', async ({ dtlsParameters }, callback) => {
          socket.send(
            JSON.stringify({
              type: 'connectProducerTransport',
              dtlsParameters,
            })
          );

          console.log(dtlsParameters);
          console.log('connect transport');

          // socket.addEventListener('producerConnected', () => {
          //   console.log('Peoducer Connected!');
          //   callback();
          // });
          socket.addEventListener('message', (event) => {
            const response = JSON.parse(event.data);
            // console.log('Event Type: ' + response.type);
            if (response.type === 'producerConnected') {
              // producerConnected
              console.log('Peoducer Connected!');
              callback();
            }
          });
        });

        transport.on('produce', ({ kind, rtpParameters }, callback) => {
          socket.send(
            JSON.stringify({
              type: 'produce',
              transportId: transport.id,
              kind,
              rtpParameters,
            })
          );

          console.log('produce transport');

          socket.addEventListener('message', async (event) => {
            const response = JSON.parse(event.data);
            console.log('Event Type: ' + response.type);
            if (response.type === 'produced') {
              const { id } = response.data;
              console.log('id: ' + id);
              callback(id);
            }
          });

          // socket.addEventListener('produced', async ({ data }) => {
          //   console.log('id: ' + id);
          //   const { id } = data;
          //   callback(id);
          // });
        });

        await produceVideo(transport);

        transport.on('connectionstatechange', (state) => {
          switch (state) {
            case 'connecting':
              console.log('connecting ...');
              textPublish.innerHTML = 'Publishing...';
              break;
            case 'connected':
              console.log('connected ...');
              console.log(localStream);
              localVideo.srcObject = localStream;
              textPublish.innerHTML = 'Published';
              break;
            case 'failed':
              console.log('connection failed ...');
              transport.close();
              break;
            default:
              break;
          }
        });
      };

      const onConsumerTransportCreated = async (event) => {
        if (event.error) {
          console.error('Consumer Transport Create Error' + event.error);
          return;
        }

        const transport = device.createRecvTransport(event.data);
        consumeTransport = transport;
        console.log('Consumer: ', transport);

        transport.on('connect', async ({ dtlsParameters }, callback) => {
          socket.send(
            JSON.stringify({
              type: 'connectConsumerTransport',
              transportId: transport.id,
              dtlsParameters,
            })
          );

          console.log(dtlsParameters);
          console.log('connect transport');

          // socket.addEventListener('producerConnected', () => {
          //   console.log('Peoducer Connected!');
          //   callback();
          // });
          socket.addEventListener('message', (event) => {
            const response = JSON.parse(event.data);
            // console.log('Event Type: ' + response.type);
            if (response.type === 'consumerConnected') {
              // producerConnected
              console.log('Consumer Connected!');
              callback();
            }
          });
        });

        transport.on('connectionstatechange', (state) => {
          switch (state) {
            case 'connecting':
              console.log('Starting ...');
              textPublish.innerHTML = 'Consuming...';
              break;
            case 'connected':
              console.log('connected ...');
              console.log(remoteStream);
              remoteVideo.srcObject = remoteStream;
              socket.send(
                JSON.stringify({
                  type: 'resume',
                })
              );
              textPublish.innerHTML = 'Consumed';
              break;
            case 'failed':
              console.log('connection failed ...');
              transport.close();
              startButton.disabled = false;
              break;
            default:
              break;
          }
        });
        const stream = await consume(transport);
      };

      const produceVideo = async (transport) => {
        try {
          localStream = await getUserMedia(transport, isWebcam);
          const track = localStream.getVideoTracks()[0];
          console.log('Video Track:', track);
          const params = { track };
          console.log('Produce2: ', transport);
          producer = await transport.produce(params);
        } catch (error) {
          console.error(error);
          // textPublish.innerHTML = 'Failed!';
        }
      };

      camButton.onclick = async (e) => {
        console.log('cam button');
        await publish(e);
      };

      screenButton.onclick = async (e) => {
        console.log('screen button');
        await publish(e);
      };

      startButton.onclick = () => {
        console.log('start button');
        subscribe();
      };

      const publish = async (e) => {
        isWebcam = e.target.id === 'cam-button';
        console.log(isWebcam);
        textPublish = isWebcam ? textWebcam : textScreen;
        screenButton.disabled = true;
        camButton.disabled = true;

        const message = {
          type: 'createProducerTransport',
          forceTcp: false,
          rtpCapabilities: device.rtpCapabilities,
        };

        socket.send(JSON.stringify(message));
        // get local stream
        // create transport
        // create producer
        // send producer
      };

      const subscribe = () => {
        startButton.disabled = true;
        const message = {
          type: 'createConsumerTransport',
          forceTcp: false,
        };

        socket.send(JSON.stringify(message));
      };

      const consume = async (transport) => {
        const { rtpCapabilities } = device;
        const message = {
          type: 'consume',
          rtpCapabilities,
        };
        socket.send(JSON.stringify(message));
      };

      const onSubscribed = async (response) => {
        const { id, producerId, kind, rtpParameters } = response.data;

        const codecOptions = {};
        const consumer = await consumeTransport.consume({
          id,
          producerId,
          kind,
          rtpParameters,
          codecOptions,
        });
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        remoteStream = stream;
      };

      const loadDevice = async (routerRtpCapabilities) => {
        try {
          console.log(routerRtpCapabilities);
          device = new mediasoupClient.Device();
        } catch (error) {
          if (error.name === 'UnsupportedError')
            console.log('Browser Not Supported!');
        }
        await device.load({ routerRtpCapabilities });
      };
    };

    const getUserMedia = async (transport, isWebcam) => {
      console.log('Produce: ', transport);
      if (!device.canProduce('video')) {
        console.error('cannot produce video');
        return;
      }
      console.log('cam button inside getUserMedia');
      let stream;
      try {
        stream = isWebcam
          ? await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true,
            })
          : await navigator.mediaDevices.getDisplayMedia({ video: true });
        console.log(stream);
      } catch (error) {
        console.error(error);
        throw error;
      }
      return stream;
      // localVideo.play();
    };

    connect();
  });

  return (
    <>
      <div className="meet-container">
        <div className="local-video__container">
          <video
            id="local-video"
            className="local-video"
            src=""
            autoPlay
            playsInline
            muted
          ></video>
          <h2 className="video-kind">Local Video</h2>
        </div>
        <div className="remote-video__container">
          <video
            id="remote-video"
            className="remote-video"
            src=""
            autoPlay
            playsInline
          ></video>
          <h2 className="video-kind">Remote Video</h2>
        </div>
      </div>
      <div id="text-publish"></div>
      <div className="buttons">
        <button id="start-button">Start</button>
        <button id="stop-button">Stop</button>
        <button id="cam-button">Cam</button>
        <button id="screen-button">Share Screen</button>
      </div>
    </>
  );
}

export default App;
