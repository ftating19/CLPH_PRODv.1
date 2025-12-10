"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, XCircle, Trash2, Edit3, Check, X } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface ChatMessage {
  message_id: number
  booking_id: number
  sender_id: number
  sender_name: string
  message: string
  is_read: boolean
  is_deleted: boolean
  created_at: string
  updated_at?: string
  first_name?: string
  last_name?: string
  role?: string
}

interface Booking {
  booking_id: number
  tutor_id: number
  tutor_name: string
  student_id: number
  student_name: string
  status?: string
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null | undefined
}

export default function ChatModal({ isOpen, onClose, booking }: ChatModalProps) {
  // Enhanced close handler to cleanup polling
  const handleClose = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    onClose()
  }
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    messageId?: number;
    messageText?: string;
  }>({ show: false })
  const [editingMessage, setEditingMessage] = useState<{
    messageId?: number;
    text: string;
  }>({ text: "" })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentUser } = useUser()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageCountRef = useRef<number>(0)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch chat messages
  const fetchMessages = async (showLoading: boolean = true) => {
    if (!booking?.booking_id || !currentUser?.user_id) return
    
    if (showLoading) {
      setLoading(true)
    }
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/sessions/${booking.booking_id}/chat?user_id=${currentUser.user_id}`)
      const data = await response.json()
      
      if (data.success) {
        const newMessages = data.messages || []
        const currentCount = newMessages.length
        
        // Only log when message count changes (new message or deleted message)
        if (currentCount !== lastMessageCountRef.current) {
          console.log(`📬 Chat updated: ${currentCount} messages for booking ${booking.booking_id}`)
        }
        
        setMessages(newMessages)
        lastMessageCountRef.current = currentCount
      } else {
        console.error('Error fetching messages:', data.error)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
    
    if (showLoading) {
      setLoading(false)
    }
  }

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUser?.user_id || !booking?.booking_id) return
    
    setSending(true)
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/sessions/${booking.booking_id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.user_id,
          message: newMessage.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setNewMessage("")
        fetchMessages(false) // Refresh messages without loading state
      } else {
        console.error('Error sending message:', data.error)
        alert('Error sending message: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    }
    setSending(false)
  }

  // Show delete confirmation dialog
  const showDeleteConfirmation = (messageId: number, messageText: string) => {
    setDeleteConfirmation({
      show: true,
      messageId,
      messageText
    })
  }

  // Delete a message after confirmation
  const deleteMessage = async () => {
    if (!currentUser?.user_id || !booking?.booking_id || !deleteConfirmation.messageId) return
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/sessions/${booking.booking_id}/chat/${deleteConfirmation.messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setDeleteConfirmation({ show: false })
        fetchMessages(false) // Refresh messages without loading state
      } else {
        console.error('Error deleting message:', data.error)
        alert('Error deleting message: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Error deleting message')
    }
  }

  // Start editing a message
  const startEditing = (messageId: number, currentText: string) => {
    setEditingMessage({
      messageId,
      text: currentText
    })
  }

  // Save edited message
  const saveEditedMessage = async () => {
    if (!currentUser?.user_id || !booking?.booking_id || !editingMessage.messageId || !editingMessage.text.trim()) return
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/sessions/${booking.booking_id}/chat/${editingMessage.messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          message: editingMessage.text.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEditingMessage({ text: "" })
        fetchMessages(false) // Refresh messages without loading state
      } else {
        console.error('Error updating message:', data.error)
        alert('Error updating message: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating message:', error)
      alert('Error updating message')
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessage({ text: "" })
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Load messages when modal opens
  useEffect(() => {
    if (isOpen && booking?.booking_id) {
      // Initial load with loading state
      fetchMessages(true)
      
      // Poll for new messages every 5 seconds (less aggressive)
      // Don't show loading state for polling to prevent UI flicker
      intervalRef.current = setInterval(() => {
        fetchMessages(false)
      }, 5000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [isOpen, booking?.booking_id])

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  if (!isOpen || !booking) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[700px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold">Session Chat</h3>
                <p className="text-blue-100 text-sm">
                  {booking?.tutor_name} & {booking?.student_name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-semibold mb-1">No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message!</p>
            </div>
          ) : (
            messages
              .filter(msg => !msg.is_deleted)
              .map((message) => {
                const isOwnMessage = message.sender_id === currentUser?.user_id
                const senderName = message.first_name && message.last_name 
                  ? `${message.first_name} ${message.last_name}`
                  : message.sender_name

                return (
                  <div key={message.message_id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                        }`}>
                          {senderName}
                          {message.role && ` (${message.role})`}
                        </span>
                        {isOwnMessage && (
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => startEditing(message.message_id, message.message)}
                              className="text-blue-200 hover:text-white"
                              title="Edit message"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => showDeleteConfirmation(message.message_id, message.message)}
                              className="text-blue-200 hover:text-white"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Message content - editable if currently editing */}
                      {editingMessage.messageId === message.message_id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingMessage.text}
                            onChange={(e) => setEditingMessage({...editingMessage, text: e.target.value})}
                            className="w-full p-2 text-sm text-gray-800 border rounded resize-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={saveEditedMessage}
                              className="flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              disabled={!editingMessage.text.trim()}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex items-center px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
                          {message.message}
                        </p>
                      )}
                      
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                        {message.updated_at && (
                          <span className={`ml-2 italic ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                            (edited)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4 rounded-b-xl">
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button 
              size="sm" 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              className="px-6"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Only you and your session partner can see these messages
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation.show} onOpenChange={(open) => !open && setDeleteConfirmation({ show: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span>Delete Message</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone and the other person will see that the message was deleted.
            </DialogDescription>
          </DialogHeader>
          
          {deleteConfirmation.messageText && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-red-400">
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "{deleteConfirmation.messageText.length > 100 
                  ? deleteConfirmation.messageText.substring(0, 100) + '...' 
                  : deleteConfirmation.messageText}"
              </p>
            </div>
          )}

          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmation({ show: false })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteMessage}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}