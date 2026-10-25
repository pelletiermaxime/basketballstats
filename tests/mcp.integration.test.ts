import { describe, it, expect, beforeAll } from 'vite-plus/test'

const MCP_URL = process.env.MCP_URL || 'http://localhost:4412/api/mcp'

describe('MCP Server Integration', () => {
  beforeAll(async () => {
    // Check if server is already running
    try {
      const response = await fetch(MCP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 0,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'vitest', version: '1.0' },
          },
        }),
      })
      if (!response.ok) {
        throw new Error(`Server not ready: ${response.status}`)
      }
    } catch (error) {
      throw new Error(
        `MCP server not running at ${MCP_URL}. Start it with: vp run dev\n${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }, 5000)

  async function sendMcpRequest(request: {
    jsonrpc: '2.0'
    id: number
    method: string
    params?: Record<string, unknown>
  }) {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    return response.json()
  }

  it('should initialize MCP server', async () => {
    const result = await sendMcpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'vitest', version: '1.0' },
      },
    })

    expect(result.jsonrpc).toBe('2.0')
    expect(result.result?.protocolVersion).toBe('2024-11-05')
    expect(result.result?.serverInfo?.name).toBe('basketball-stats')
  })

  it('should list available tools', async () => {
    const result = await sendMcpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    })

    expect(result.result?.tools).toHaveLength(1)
    expect(result.result?.tools[0]?.name).toBe('list_top_scorers')
    expect(result.result?.tools[0]?.description).toBe(
      'Get top scorers for an NBA season, ranked by points per game',
    )
  })

  it('should return top scorers for 2025', async () => {
    const result = await sendMcpRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_top_scorers',
        arguments: { year: 2025, limit: 5 },
      },
    })

    expect(result.result?.content?.[0]?.type).toBe('text')
    expect(result.result?.content?.[0]?.text).toContain('Top')
    expect(result.result?.content?.[0]?.text).toContain('2025')
  })

  it('should return 50 players by default', async () => {
    const result = await sendMcpRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'list_top_scorers',
        arguments: { year: 2025 },
      },
    })

    const text = result.result?.content?.[0]?.text as string
    const playerCount = text.split('\n').filter((line: string) => /^\d+\./.test(line)).length
    expect(playerCount).toBe(50)
  })
})
