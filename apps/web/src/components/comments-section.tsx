"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"

interface Comment {
  id: number
  username: string
  text: string
  heart: boolean
  date: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/apis/v1"

export function CommentsSection() {
  const { token, isAdmin } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState("")
  const [text, setText] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadComments()
  }, [])

  async function loadComments() {
    try {
      const response = await fetch(`${API_BASE}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.success ? data.data : data)
      }
    } catch (err) {
      console.error("Failed to load comments:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!username.trim()) {
      setError("Vui long nhap nickname")
      return
    }
    if (!text.trim()) {
      setError("Vui long nhap noi dung gop y")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), text: text.trim() }),
      })

      const data = await response.json()

      if (response.ok && (data.ok || data.success)) {
        setUsername("")
        setText("")
        await loadComments()
      } else if (response.status === 429) {
        setError(data.error || "Ban da gop y qua nhieu")
      } else {
        setError(data.error || "Khong the gui gop y")
      }
    } catch (err) {
      setError("Khong the gui gop y. Vui long thu lai!")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleHeart(id: number) {
    if (!token || !isAdmin) return

    try {
      const response = await fetch(`${API_BASE}/comments/${id}/toggle-heart`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        await loadComments()
      }
    } catch (err) {
      console.error("Failed to toggle heart:", err)
    }
  }

  async function deleteComment(id: number) {
    if (!token || !isAdmin) return
    if (!confirm("Ban chac chan muon xoa gop y nay?")) return

    try {
      const response = await fetch(`${API_BASE}/comments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        await loadComments()
      }
    } catch (err) {
      console.error("Failed to delete comment:", err)
    }
  }

  return (
    <div className="mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Gop y cho Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhap nickname cua ban"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Noi dung gop y</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Viet gop y cua ban..."
                rows={3}
                disabled={submitting}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Dang gui..." : "Gui gop y"}
            </Button>
          </form>

          {/* Comments List */}
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Dang tai gop y...</p>
          ) : comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Chua co gop y nao. Hay la nguoi dau tien gop y!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{comment.username}</span>
                        <span className="text-xs text-muted-foreground">{comment.date}</span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant={comment.heart ? "default" : "outline"}
                            onClick={() => toggleHeart(comment.id)}
                          >
                            {comment.heart ? "♥" : "♡"} Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteComment(comment.id)}
                          >
                            🗑
                          </Button>
                        </>
                      )}
                      {!isAdmin && comment.heart && (
                        <span className="text-sm text-red-500">♥ Admin</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
