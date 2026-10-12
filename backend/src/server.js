const app = require('./app');
const database = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startup() {
  console.log('Starting application...');
  await database.initialize();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startup();

async function shutdown(e) {
  let err = e;
  console.log('Shutting down...');
  try {
    await database.close();
  } catch (e) {
    console.error(e);
    err = err || e;
  }
  if (err) {
    process.exit(1); 
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown());
process.on('SIGINT', () => shutdown());
process.on('uncaughtException', err => {
  console.error('Uncaught exception');
  console.error(err);
  shutdown(err);
});
