const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS, // Your email password or app-specific password
    },
  });
};

// Generate a temporary password
const generateTemporaryPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required set
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Send welcome email with temporary password
const sendWelcomeEmail = async (userEmail, userName, temporaryPassword, role) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CPLH Platform" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Welcome to CPLH Platform - Your Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to CPLH Platform</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CPLH Platform!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hello ${userName},</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your account has been successfully created on the CPLH Platform. Below are your login credentials:
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Account Details</h3>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Role:</strong> ${role}</p>
              <p><strong>Temporary Password:</strong> 
                <span style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-size: 14px; border: 1px solid #dee2e6;">
                  ${temporaryPassword}
                </span>
              </p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">🔒 Important Security Notice</h4>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>This is a temporary password that expires in 24 hours</li>
                <li>You will be required to change this password on your first login</li>
                <li>Do not share this password with anyone</li>
                <li>If you didn't request this account, please contact support immediately</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: #667eea; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <div style="font-size: 14px; color: #6c757d;">
              <p><strong>Need Help?</strong></p>
              <p>If you have any questions or need assistance, please contact our support team.</p>
              <p style="margin-bottom: 0;">
                Best regards,<br>
                The CPLH Platform Team
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
            <p>This email was sent to ${userEmail}. If you believe this was sent in error, please contact support.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to CPLH Platform!

Hello ${userName},

Your account has been successfully created. Here are your login credentials:

Email: ${userEmail}
Role: ${role}
Temporary Password: ${temporaryPassword}

IMPORTANT SECURITY NOTICE:
- This is a temporary password that expires in 24 hours
- You will be required to change this password on your first login
- Do not share this password with anyone
- If you didn't request this account, please contact support immediately

Login at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

If you have any questions or need assistance, please contact our support team.

Best regards,
The CPLH Platform Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send tutor approval notification email
const sendTutorApprovalEmail = async (userEmail, userName, subjectName, subjectCode) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CPLH Platform" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Congratulations! Your Tutor Application Has Been Approved',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tutor Application Approved - CPLH Platform</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
            <h2 style="color: white; margin: 10px 0 0 0; font-size: 20px;">Your Tutor Application Has Been Approved</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hello ${userName},</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We are excited to inform you that your tutor application has been <strong style="color: #10b981;">approved</strong>! 
              You are now officially a tutor on the CICT Peer Learning Hub platform.
            </p>
            
            <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #10b981;">📚 Your Tutoring Subject</h3>
              <p style="font-size: 18px; margin: 0;">
                <strong>${subjectCode} - ${subjectName}</strong>
              </p>
            </div>
            
            <div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #0958d9; margin-top: 0;">🚀 What's Next?</h4>
              <ul style="color: #0958d9; margin: 0; padding-left: 20px;">
                <li>Your account has been upgraded to <strong>Tutor</strong> status</li>
                <li>Students can now find and contact you for tutoring sessions</li>
                <li>You can access the tutor dashboard and manage your sessions</li>
                <li>You'll receive notifications when students request your help</li>
              </ul>
            </div>
            
            <div style="background: #fff9c4; border: 1px solid #fadb14; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #d48806; margin-top: 0;">💡 Tutor Guidelines</h4>
              <ul style="color: #d48806; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Be professional and respectful in all interactions</li>
                <li>Respond to student inquiries promptly</li>
                <li>Provide clear explanations and helpful resources</li>
                <li>Maintain the highest standards of academic integrity</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: #10b981; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                Access Tutor Dashboard
              </a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-matching" 
                 style="background: #0958d9; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Students
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <div style="font-size: 14px; color: #6c757d;">
              <p><strong>Questions or Need Support?</strong></p>
              <p>If you have any questions about tutoring or need assistance, please don't hesitate to contact our support team.</p>
              <p style="margin-bottom: 0;">
                Welcome to the CICT Peer Learning Hub family!<br><br>
                Best regards,<br>
                The CPLH Platform Team
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
            <p>This email was sent to ${userEmail}. If you believe this was sent in error, please contact support.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Congratulations! Your Tutor Application Has Been Approved

Hello ${userName},

We are excited to inform you that your tutor application has been approved! You are now officially a tutor on the CICT Peer Learning Hub platform.

Your Tutoring Subject: ${subjectCode} - ${subjectName}

What's Next?
- Your account has been upgraded to Tutor status
- Students can now find and contact you for tutoring sessions
- You can access the tutor dashboard and manage your sessions
- You'll receive notifications when students request your help

Tutor Guidelines:
- Be professional and respectful in all interactions
- Respond to student inquiries promptly
- Provide clear explanations and helpful resources
- Maintain the highest standards of academic integrity

Access your tutor dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard
View students: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-matching

Questions or Need Support?
If you have any questions about tutoring or need assistance, please don't hesitate to contact our support team.

Welcome to the CICT Peer Learning Hub family!

Best regards,
The CPLH Platform Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Tutor approval email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending tutor approval email:', error);
    return { success: false, error: error.message };
  }
};

// Send tutor rejection notification email
const sendTutorRejectionEmail = async (userEmail, userName, subjectName, subjectCode, rejectionReason = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CPLH Platform" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Update on Your Tutor Application - CPLH Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tutor Application Update - CPLH Platform</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6b73ff 0%, #000dff 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Tutor Application Update</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hello ${userName},</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for your interest in becoming a tutor on the CICT Peer Learning Hub platform. 
              We have carefully reviewed your application for <strong>${subjectCode} - ${subjectName}</strong>.
            </p>
            
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #856404;">📋 Application Status</h3>
              <p style="font-size: 16px; margin: 0;">
                Unfortunately, we are unable to approve your tutor application at this time.
              </p>
            </div>
            
            ${rejectionReason ? `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #721c24; margin-top: 0;">📝 Feedback</h4>
              <p style="color: #721c24; margin: 0;">${rejectionReason}</p>
            </div>
            ` : ''}
            
            <div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #0958d9; margin-top: 0;">🔄 What's Next?</h4>
              <ul style="color: #0958d9; margin: 0; padding-left: 20px;">
                <li>You can reapply in the future after addressing any feedback provided</li>
                <li>Consider gaining more experience or qualifications in the subject area</li>
                <li>You can still use the platform as a student to access tutoring services</li>
                <li>Feel free to contact support if you have questions about the decision</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tutor-matching" 
                 style="background: #6b73ff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Apply Again Later
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <div style="font-size: 14px; color: #6c757d;">
              <p><strong>Questions or Need Support?</strong></p>
              <p>If you have any questions about this decision or need guidance on reapplying, please don't hesitate to contact our support team.</p>
              <p style="margin-bottom: 0;">
                Thank you for your understanding.<br><br>
                Best regards,<br>
                The CPLH Platform Team
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
            <p>This email was sent to ${userEmail}. If you believe this was sent in error, please contact support.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Tutor Application Update

Hello ${userName},

Thank you for your interest in becoming a tutor on the CICT Peer Learning Hub platform. We have carefully reviewed your application for ${subjectCode} - ${subjectName}.

Application Status:
Unfortunately, we are unable to approve your tutor application at this time.

${rejectionReason ? `Feedback: ${rejectionReason}` : ''}

What's Next?
- You can reapply in the future after addressing any feedback provided
- Consider gaining more experience or qualifications in the subject area
- You can still use the platform as a student to access tutoring services
- Feel free to contact support if you have questions about the decision

Apply again: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/tutor-matching

Questions or Need Support?
If you have any questions about this decision or need guidance on reapplying, please don't hesitate to contact our support team.

Thank you for your understanding.

Best regards,
The CPLH Platform Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Tutor rejection email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending tutor rejection email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email server connection verified successfully');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
};

module.exports = {
  generateTemporaryPassword,
  sendWelcomeEmail,
  sendTutorApprovalEmail,
  sendTutorRejectionEmail,
  testEmailConnection
};
