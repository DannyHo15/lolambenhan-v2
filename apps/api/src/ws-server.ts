/**
 * WebSocket Server for Realtime Collaboration
 * Runs separately from HTTP API
 */
import { WebSocketServer, WebSocket } from "ws"

const PORT = Number(process.env.WS_PORT || 3003)

interface RoomState {
  clients: Map<WebSocket, { clientId: string | null }>
  lastState: Record<string, unknown> | null
  locks: Map<string, { by: string; at: number }>
}

interface WSMessage {
  type: "join" | "lock" | "unlock" | "state" | "clear" | "ping"
  room: string
  clientId?: string
  fieldId?: string
  by?: string
  payload?: Record<string, unknown>
}

const rooms = new Map<string, RoomState>()

function getRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Map(),
      lastState: null,
      locks: new Map(),
    })
  }
  return rooms.get(roomId)!
}

function broadcast(roomId: string, data: unknown, excludeWs?: WebSocket) {
  const room = rooms.get(roomId)
  if (!room) return

  const message = JSON.stringify(data)
  for (const [ws] of room.clients) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  }
}

function getSafeClientId(ws: WebSocket): string {
  return (ws as any)._clientId || `anon_${Math.random().toString(36).slice(2, 9)}`
}

const wss = new WebSocketServer({ port: PORT })

console.log(`WebSocket Server running on ws://localhost:${PORT}`)

wss.on("connection", (ws) => {
  ;(ws as any)._roomId = null
  ;(ws as any)._clientId = null

  ws.on("message", (data) => {
    try {
      const msg: WSMessage = JSON.parse(data.toString())
      const { type, room: roomId, clientId } = msg || {}

      const by = msg.by || clientId || getSafeClientId(ws)

      if (clientId && !(ws as any)._clientId) {
        ;(ws as any)._clientId = clientId
      }
      if (msg.by && !(ws as any)._clientId) {
        ;(ws as any)._clientId = msg.by
      }

      if (!type || !roomId) return

      if (type === "join") {
        const room = getRoom(roomId)
        room.clients.set(ws, { clientId: by })
        ;(ws as any)._roomId = roomId

        // Send current state and locks
        if (room.lastState) {
          ws.send(
            JSON.stringify({
              type: "state",
              room: roomId,
              clientId: "server",
              payload: room.lastState,
            })
          )
        }

        ws.send(
          JSON.stringify({
            type: "locks",
            room: roomId,
            payload: Object.fromEntries(room.locks),
          })
        )

        ws.send(JSON.stringify({ type: "joined", room: roomId, clientId: by }))
        broadcast(roomId, { type: "presence", room: roomId, count: room.clients.size })
        return
      }

      // Ensure client is in room
      if ((ws as any)._roomId !== roomId) {
        const room = getRoom(roomId)
        room.clients.set(ws, { clientId: by })
        ;(ws as any)._roomId = roomId
      }

      if (type === "lock") {
        const room = getRoom(roomId)
        const fieldId = String(msg.fieldId || "").trim()
        if (!fieldId) return

        const cur = room.locks.get(fieldId)
        if (cur && cur.by && cur.by !== by) {
          ws.send(
            JSON.stringify({
              type: "lock-denied",
              room: roomId,
              fieldId,
              by: cur.by,
              at: cur.at || Date.now(),
            })
          )
          return
        }

        room.locks.set(fieldId, { by, at: Date.now() })
        broadcast(roomId, { type: "lock", room: roomId, fieldId, by, at: Date.now() })
        return
      }

      if (type === "unlock") {
        const room = getRoom(roomId)
        const fieldId = String(msg.fieldId || "").trim()
        if (!fieldId) return

        const cur = room.locks.get(fieldId)
        if (cur && cur.by === by) {
          room.locks.delete(fieldId)
          broadcast(roomId, { type: "unlock", room: roomId, fieldId, by, at: Date.now() })
        }
        return
      }

      if (type === "state") {
        const room = getRoom(roomId)
        if (msg.payload && typeof msg.payload === "object") {
          room.lastState = msg.payload
        }
        broadcast(roomId, { type: "state", room: roomId, clientId: by, payload: msg.payload })
        return
      }

      if (type === "clear") {
        const room = getRoom(roomId)
        room.lastState = null
        room.locks.clear()
        broadcast(roomId, { type: "locks", room: roomId, payload: {} })
        broadcast(roomId, { type: "clear", room: roomId, clientId: by })
        return
      }

      if (type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }))
        return
      }
    } catch (err) {
      console.error("WebSocket message error:", err)
    }
  })

  ws.on("close", () => {
    const roomId = (ws as any)._roomId
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room) return

    const clientId = (ws as any)._clientId
    if (clientId) {
      // Unlock all fields owned by this client
      const toUnlock: string[] = []
      for (const [fieldId, meta] of room.locks.entries()) {
        if (meta.by === clientId) {
          toUnlock.push(fieldId)
        }
      }

      for (const fieldId of toUnlock) {
        room.locks.delete(fieldId)
        broadcast(roomId, { type: "unlock", room: roomId, fieldId, by: clientId, at: Date.now() })
      }

      if (toUnlock.length > 0) {
        broadcast(roomId, {
          type: "locks",
          room: roomId,
          payload: Object.fromEntries(room.locks),
        })
      }
    }

    room.clients.delete(ws)
    if (room.clients.size === 0) {
      rooms.delete(roomId)
    } else {
      broadcast(roomId, { type: "presence", room: roomId, count: room.clients.size })
    }
  })

  ws.on("error", (err) => {
    console.error("WebSocket error:", err)
  })
})

// Heartbeat to keep connections alive
setInterval(() => {
  for (const [roomId, room] of rooms) {
    for (const [ws] of room.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "heartbeat", room: roomId, count: room.clients.size }))
      }
    }
  }
}, 30000)

console.log(`
   ╔════════════════════════════════════════╗
   ║   🔄 WebSocket Server (Collaboration)  ║
   ║                                        ║
   ║   WS URL: ws://localhost:${PORT}        ║
   ╚════════════════════════════════════════╝
`)
