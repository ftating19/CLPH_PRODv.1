// Test script for rating reminder email functionality
require('dotenv').config();
const { sendRatingReminderEmail } = require('./services/emailService');

async function testRatingReminderEmail() {
  console.log('🧪 Testing Rating Reminder Email...');
  
  try {
    // Test data
    const testData = {
      studentEmail: 'test@example.com',
      studentName: 'John Doe',
      tutorName: 'Jane Smith',
      sessionDate: 'December 8, 2025',
      sessionTime: '10:00 AM - 11:00 AM'
    };
    
    console.log('📧 Sending rating reminder email...');
    const result = await sendRatingReminderEmail(
      testData.studentEmail,
      testData.studentName,
      testData.tutorName,
      testData.sessionDate,
      testData.sessionTime
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ Email failed to send:');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRatingReminderEmail();