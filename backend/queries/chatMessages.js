// backend/queries/chatMessages.js
const db = require('../dbconnection/mysql')

// Create a new chat message
async function createChatMessage(pool, { booking_id, sender_id, sender_name, message }) {
  try {
    const [result] = await pool.query(
      `INSERT INTO chat_messages (booking_id, sender_id, sender_name, message, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [booking_id, sender_id, sender_name, message]
    )
    return result.insertId
  } catch (err) {
    console.error('Error creating chat message:', err)
    throw err
  }
}

// Get all chat messages for a booking session
async function getChatMessagesByBooking(pool, booking_id) {
  try {
    const [rows] = await pool.query(
      `SELECT cm.*, u.first_name, u.last_name, u.role
       FROM chat_messages cm
       LEFT JOIN users u ON cm.sender_id = u.user_id
       WHERE cm.booking_id = ?
       ORDER BY cm.created_at ASC`,
      [booking_id]
    )
    return rows
  } catch (err) {
    console.error('Error fetching chat messages:', err)
    throw err
  }
}

// Mark messages as read by a user
async function markMessagesAsRead(pool, booking_id, user_id) {
  try {
    const [result] = await pool.query(
      `UPDATE chat_messages 
       SET is_read = TRUE 
       WHERE booking_id = ? AND sender_id != ? AND is_read = FALSE`,
      [booking_id, user_id]
    )
    return result.affectedRows
  } catch (err) {
    console.error('Error marking messages as read:', err)
    throw err
  }
}

// Get unread message count for a user in a booking
async function getUnreadMessageCount(pool, booking_id, user_id) {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM chat_messages
       WHERE booking_id = ? AND sender_id != ? AND is_read = FALSE`,
      [booking_id, user_id]
    )
    return rows[0].unread_count
  } catch (err) {
    console.error('Error getting unread message count:', err)
    throw err
  }
}

// Delete a chat message (soft delete)
async function deleteChatMessage(pool, message_id, user_id) {
  try {
    const [result] = await pool.query(
      `UPDATE chat_messages 
       SET is_deleted = TRUE 
       WHERE message_id = ? AND sender_id = ?`,
      [message_id, user_id]
    )
    return result.affectedRows > 0
  } catch (err) {
    console.error('Error deleting chat message:', err)
    throw err
  }
}

// Update a chat message
async function updateChatMessage(pool, message_id, user_id, new_message) {
  try {
    const [result] = await pool.query(
      `UPDATE chat_messages 
       SET message = ?, updated_at = NOW()
       WHERE message_id = ? AND sender_id = ?`,
      [new_message, message_id, user_id]
    )
    return result.affectedRows > 0
  } catch (err) {
    console.error('Error updating chat message:', err)
    throw err
  }
}

module.exports = {
  createChatMessage,
  getChatMessagesByBooking,
  markMessagesAsRead,
  getUnreadMessageCount,
  deleteChatMessage,
  updateChatMessage
}