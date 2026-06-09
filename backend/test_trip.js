import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 5004,
  path: '/api/trips',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  destination: 'Paris',
  startDate: '2026-06-15',
  endDate: '2026-06-20',
  budget: 1500,
  travelStyle: 'luxury'
}));
req.end();
