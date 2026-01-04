const http = require('http')

const PORT = 3845

const server = http.createServer((req, res) => {
  if (req.url === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    res.write(': welcome\n\n')
    const iv = setInterval(() => {
      res.write(`data: ping ${new Date().toISOString()}\n\n`)
    }, 5000)
    req.on('close', () => {
      clearInterval(iv)
    })
  } else if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, received: body }))
    })
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('MCP Figma debug server running')
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Debug MCP Figma server listening on http://127.0.0.1:${PORT}`)
})
