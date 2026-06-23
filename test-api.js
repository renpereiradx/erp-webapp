const http = require('http');

http.get('http://localhost:8000/brand/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response /brand/:", data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
