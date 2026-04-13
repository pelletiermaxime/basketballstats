import server from '../dist/server/server.js'

export default async (req, res) => {
  // Create a Request object from the Vercel req
  const url = new URL(req.url, `https://${req.headers.host}`)
  const request = new Request(url, {
    method: req.method,
    headers: new Headers(req.headers),
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
  })

  // Call the server handler
  const response = await server.fetch(request)

  // Send the response back
  res.statusCode = response.status
  res.statusMessage = response.statusText

  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  const body = await response.text()
  res.end(body)
}
