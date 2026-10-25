import { defineEventHandler, readBody, getMethod, getRequestURL } from 'nitro/h3'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createServer } from '../../src/lib/mcp/server.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Last-Event-ID',
  'Access-Control-Max-Age': '86400',
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Create new server and transport for each request (stateless HTTP)
  const server = createServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)

  try {
    // Get headers and URL
    const headers = Object.fromEntries(event.req.headers.entries())
    const url = getRequestURL(event)

    // Read body for POST requests
    let body: BodyInit | undefined
    if (method === 'POST') {
      const requestBody = await readBody(event)
      body = JSON.stringify(requestBody)
    }

    // Create web Request
    const request = new Request(url, {
      method,
      headers: new Headers(headers as Record<string, string>),
      body,
    })

    // Let the SDK transport handle the request
    const response = await transport.handleRequest(request)

    // Create response with CORS headers
    const responseHeaders = new Headers(response.headers)
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } finally {
    // Clean up
    await transport.close()
    await server.close()
  }
})
