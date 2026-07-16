const https = require('https');

const checkSwagger = (path) => {
  return new Promise((resolve) => {
    https.get(`https://managerhourse-be.onrender.com${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.paths) {
            console.log(`Found swagger at ${path}`);
            console.log(Object.keys(json.paths).filter(p => p.includes('jockey') || p.includes('admin')).join('\n'));
            resolve(true);
          } else {
            resolve(false);
          }
        } catch(e) {
          resolve(false);
        }
      });
    }).on('error', () => resolve(false));
  });
};

(async () => {
  const paths = [
    '/api-docs-json',
    '/api-docs/swagger.json',
    '/swagger.json',
    '/api-docs-json/',
    '/api-json',
    '/v1/api-docs'
  ];
  for (const p of paths) {
    if (await checkSwagger(p)) break;
  }
})();
