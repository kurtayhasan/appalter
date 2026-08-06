import http from 'http';

http.get('http://localhost:3000', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', () => {}); // Consume response data to free up memory
});
