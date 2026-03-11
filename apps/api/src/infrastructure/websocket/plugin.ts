/**
 * WebSocket Plugin for Elysia - Realtime collaboration for bệnh án
 */
import { Elysia } from "elysia"
import { WebSocket, WebSocketServer } from "ws"

interface RoomState {
  clients: Set<WebSocket>
  lastState: Record<string, unknown> | null
  locks: Map<string, { by: string; at: number }>
}

interface WSMessage {
  type: "join" | "lock" | "unlock" | "state" | "clear"
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
      clients: new Set(),
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
  for (const client of room.clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
}

export const websocketPlugin = (app: Elysia) =>
  app
    .get("/ws", ({ request }) => {
      // Upgrade HTTP to WebSocket
      if (request.headers.get("upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 })
      }

      return new Response(null {
        status: 101,
        webSocket: {
          open: (ws) => {
            ws._roomId = null
            ws._clientId = null
          },
          message: (ws, message) => {
            try {
              const data: WSMessage = JSON.parse(message.toString())
              const { type, room: roomId, clientId } = data || {}

              const by = data.by || clientId || ws._clientId || null
              if (clientId && !ws._clientId) ws._clientId = clientId
              if (data.by && !ws._clientId) ws._clientId = data.by

              if (!type || !roomId) return

              if (type === "join") {
                const room = getRoom(roomId)
                room.clients.add(ws)
                ws._roomId = roomId
                if (by && !ws._clientId) ws._clientId = by

                // Send current state
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

                // Send current locks
                ws.send(
                  JSON.stringify({
                    type: "locks",
                      room: roomId,
                      payload: Object.fromEntries(room.locks),
                    })
                  )
                )

                // Notify presence
                broadcast(
                  roomId,
                  { type: "presence", room: roomId, count: room.clients.size }
                )
                return
              }

              if (ws._roomId !== roomId) {
                const room = getRoom(roomId)
                room.clients.add(ws)
                ws._roomId = roomId
                if (by && !ws._clientId) ws._clientId = by
              }

              if (type === "lock") {
                const room = getRoom(roomId)
                const fieldId = String(data.fieldId || "").trim()
                const locker = by

                if (!fieldId || !locker) return

                const cur = room.locks.get(fieldId)
                if (cur && cur.by && cur.by !== locker) {
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

                room.locks.set(fieldId, { by: locker, at: Date.now() })
                broadcast(
                  roomId,
                  { type: "lock", room: roomId, fieldId, by: locker, at: Date.now() },
                  ws
                )
                return
              }

              if (type === "unlock") {
                const room = getRoom(roomId)
                const fieldId = String(data.fieldId || "").trim()
                const locker = by

                if (!fieldId || !locker) return

                const cur = room.locks.get(fieldId)
                if (cur && cur.by === locker) {
                  room.locks.delete(fieldId)
                  broadcast(
                    roomId,
                    { type: "unlock", room: roomId, fieldId, by: locker, at: Date.now() },
                    ws
                  )
                }
                return
              }

              if (type === "state") {
                const room = getRoom(roomId)
                if (data.payload && typeof data.payload === "object") {
                  room.lastState = data.payload
                }
                broadcast(
                  roomId,
                  { type: "state", room: roomId, clientId: by, payload: data.payload },
                  ws
                )
                return
              }

              if (type === "clear") {
                const room = getRoom(roomId)
                room.lastState = null
                room.locks.clear()
                broadcast(
                  roomId,
                  { type: "locks", room: roomId, payload: {} },
                  null
                )
                broadcast(roomId, { type: "clear", room: roomId, clientId: by }, ws)
              }
            } catch (err) {
              console.error("WebSocket message error:", err)
            }
          },
          close: (ws) => {
            const roomId = ws._roomId
            if (!roomId) return

            const room = rooms.get(roomId)
            if (!room) return

            const clientId = ws._clientId
            if (clientId) {
              // Unlock all fields owned by this client
              const toUnlock: string[] = []
              for (const [fieldId, meta] of room.locks.entries()) {
                if (meta.by === clientId) toUnlock.push(fieldId)
              }

              for (const fieldId of toUnlock) {
                room.locks.delete(fieldId)
                broadcast(
                  roomId,
                  { type: "unlock", room: roomId, fieldId, by: clientId, at: Date.now() }
                )
              }

              if (toUnlock.length > 0) {
                broadcast(
                  roomId,
                  {
                    type: "locks",
                    room: roomId,
                    payload: Object.fromEntries(room.locks),
                  },
                  null
                )
              }
            }

            room.clients.delete(ws)
            if (room.clients.size === 0) {
              rooms.delete(roomId)
            } else {
              broadcast(roomId, { type: "presence", room: roomId, count: room.clients.size })
            }
          },
        } as any,
      })
    })
