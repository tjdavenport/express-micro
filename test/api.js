const axios = require('axios');

describe('json api', () => {
  it('supports local authentication', async function() {
    await axios.post('http://localhost:1337/api/auth/login', {
      email: this.user.email,
      password: this.password,
    });
  });
});
