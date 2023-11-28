import * as mediasoup from 'mediasoup';
import { Worker, Router } from 'mediasoup/node/lib/types';
import config from '../config';

const worker: Array<{
  worker: Worker;
  router: Router;
}> = [];

const createWorker = async () => {
  let worker: Worker;
  try {
    worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });
  } catch (error) {
    throw error;
  }

  worker.on('died', () => {
    console.error(
      `mediasoup worker died, Exiting in 2 seconds ... ${worker.pid}`
    );
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });

  const mediasoupRouter = await worker.createRouter({
    mediaCodecs: config.mediasoup.router.mediaCodecs,
  });

  return mediasoupRouter;
};

export default createWorker;
