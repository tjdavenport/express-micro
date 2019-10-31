require('dotenv').config();
const path = require('path');
const fsx = require('fs-extra');
const {sql, models} = require('../db');
const childProcess = require('child_process');


before('fresh db', async function() {
  await sql.sync({logging: false, force: true});

  const user = new models.User();
  const password = 'Foobarbaz123!';
  user.set({
    name: 'John Doe',
    email: 'john-doe@email.com',
  });
  await user.safePassword(password);
  await user.save({logging: false});
  this.user = user;
  this.password = password;
});

before('start server and stream logs', function(done) {
  const logPath = path.join('tmp', 'test-log.txt');
  fsx.removeSync(logPath);
  fsx.ensureFileSync(logPath);
  this.log = fsx.createWriteStream(logPath);
  this.server = childProcess.spawn('node', ['index.js']);

  this.server.stdout.pipe(this.log);
  this.server.stderr.pipe(this.log);

  const dataHandler = data => {
    if (data.toString().includes('listening')) {
      this.server.stderr.off('data', dataHandler);
      done();
    }
  };
  this.server.stderr.on('data', dataHandler);
});

after('clean up', function() {
  this.server.kill();
  this.log.close();
  sql.close();
});
