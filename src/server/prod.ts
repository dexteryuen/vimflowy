import * as http from 'http';
import * as fs from 'fs';

import * as express from 'express';
import * as minimist from 'minimist';

import logger from '../assets/ts/utils/logger';

import makeSocketServer from './socket_server';
import { staticDir, buildDir } from './webpack_configs';

async function main(args: any) {
  if (args.help || args.h) {
    process.stdout.write(`
      Usage: ./node_modules/.bin/ts-node ${process.argv[1]}
          -h, --help: help menu

          --host $hostname: Host to listen on
          --port $portnumber: Port to run on

          --db $dbtype: If a db is set, we will additionally run a socket server.
            Available options:
            - 'sqlite' to use sqlite backend
            Any other value currently defaults to an in-memory backend.
          --password: password to protect database with (defaults to empty)

          --dbfolder: For sqlite backend only.  Folder for sqlite to store data
            (defaults to in-memory if unspecified)

    `, () => {
      process.exit(0);
    });
    return;
  }

  // TODO: configurable staticDir?
  //
  let port: number = args.port || 3000;
  let host: string = args.host || 'localhost';

  if (!fs.existsSync(buildDir)) {
    logger.info(`No assets found at ${buildDir}.  Try running \`npm run build\` first.`);
    return;
  }
  logger.info('Starting production server');
  const app = express();
  app.use(express.static(staticDir));
  const server = http.createServer(app);
  if (args.db) {
    const options = {
      db: args.db,
      dbfolder: args.dbfolder,
      password: args.password,
      path: '/socket',
    };
    makeSocketServer(server, options);
  }
  server.listen(port, host, (err: Error) => {
    if (err) { return logger.error(err); }
    logger.info('Listening on http://%s:%d', server.address().address, server.address().port);
  });
}

main(minimist(process.argv.slice(2)));
