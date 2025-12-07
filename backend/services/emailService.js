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

// Send material approval notification email
const sendMaterialApprovalEmail = async (userEmail, userName, materialTitle, reviewerName = 'Admin') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CPLH Platform" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Learning Resource Approved - CPLH Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Learning Resource Approved - CPLH Platform</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Great News!</h1>
            <h2 style="color: white; margin: 10px 0 0 0; font-size: 20px;">Your Learning Resource Has Been Approved</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hello ${userName},</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We are excited to inform you that your learning resource has been <strong style="color: #10b981;">approved</strong>! 
              It is now available for all students to access and download.
            </p>
            
            <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #10b981;">📚 Your Learning Resource</h3>
              <p style="font-size: 18px; margin: 0;">
                <strong>"${materialTitle}"</strong>
              </p>
            </div>
            
            <div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #0958d9; margin-top: 0;">🚀 What's Next?</h4>
              <ul style="color: #0958d9; margin: 0; padding-left: 20px;">
                <li>Your resource is now live and available to all students</li>
                <li>Students can search, preview, and download your material</li>
                <li>You can track downloads and views in the learning resources section</li>
                <li>Thank you for contributing to our learning community!</li>
              </ul>
            </div>
            
            <div style="background: #fff9c4; border: 1px solid #fadb14; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #d48806; margin-top: 0;">💡 Sharing Guidelines</h4>
              <ul style="color: #d48806; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Continue sharing high-quality educational content</li>
                <li>Ensure all materials are original or properly attributed</li>
                <li>Help maintain our academic integrity standards</li>
                <li>Feel free to upload more resources in the future</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/learning-resources" 
                 style="background: #10b981; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Learning Resources
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <div style="font-size: 14px; color: #6c757d;">
              <p><strong>Questions or Need Support?</strong></p>
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p style="margin-bottom: 0;">
                Thank you for contributing to our learning community!<br><br>
                Reviewed and approved by: ${reviewerName}<br>
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
Great News! Your Learning Resource Has Been Approved

Hello ${userName},

We are excited to inform you that your learning resource has been approved! It is now available for all students to access and download.

Your Learning Resource: "${materialTitle}"

What's Next?
- Your resource is now live and available to all students
- Students can search, preview, and download your material
- You can track downloads and views in the learning resources section
- Thank you for contributing to our learning community!

Sharing Guidelines:
- Continue sharing high-quality educational content
- Ensure all materials are original or properly attributed
- Help maintain our academic integrity standards
- Feel free to upload more resources in the future

View Learning Resources: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/learning-resources

Questions or Need Support?
If you have any questions or need assistance, please don't hesitate to contact our support team.

Thank you for contributing to our learning community!

Best regards,
The CPLH Platform Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Material approval email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending material approval email:', error);
    return { success: false, error: error.message };
  }
};

// Send material rejection notification email
const sendMaterialRejectionEmail = async (userEmail, userName, materialTitle, rejectionReason = null, reviewerName = 'Admin') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CPLH Platform" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Update on Your Learning Resource Submission - CPLH Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Learning Resource Update - CPLH Platform</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6b73ff 0%, #000dff 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Learning Resource Update</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hello ${userName},</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for your submission to the CICT Peer Learning Hub platform. 
              We have carefully reviewed your learning resource <strong>"${materialTitle}"</strong>.
            </p>
            
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #856404;">📋 Submission Status</h3>
              <p style="font-size: 16px; margin: 0;">
                Unfortunately, we are unable to approve your learning resource submission at this time.
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
                <li>You can resubmit your resource after addressing any feedback provided</li>
                <li>Ensure your content meets our quality and academic integrity standards</li>
                <li>Consider reviewing our content guidelines before resubmission</li>
                <li>Feel free to contact support if you have questions about the decision</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/learning-resources" 
                 style="background: #0958d9; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Submit New Resource
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <div style="font-size: 14px; color: #6c757d;">
              <p><strong>Questions or Need Support?</strong></p>
              <p>If you have any questions about this decision or need assistance, please don't hesitate to contact our support team.</p>
              <p style="margin-bottom: 0;">
                We appreciate your interest in contributing to our learning community.<br><br>
                Reviewed by: ${reviewerName}<br>
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
Learning Resource Update

Hello ${userName},

Thank you for your submission to the CICT Peer Learning Hub platform. We have carefully reviewed your learning resource "${materialTitle}".

Submission Status:
Unfortunately, we are unable to approve your learning resource submission at this time.

${rejectionReason ? `Feedback: ${rejectionReason}` : ''}

What's Next?
- You can resubmit your resource after addressing any feedback provided
- Ensure your content meets our quality and academic integrity standards
- Consider reviewing our content guidelines before resubmission
- Feel free to contact support if you have questions about the decision

Submit New Resource: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/learning-resources

Questions or Need Support?
If you have any questions about this decision or need assistance, please don't hesitate to contact our support team.

We appreciate your interest in contributing to our learning community.

Best regards,
The CPLH Platform Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Material rejection email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending material rejection email:', error);
    return { success: false, error: error.message };
  }
};

// Send post-test approval email to tutor
const sendPostTestApprovalEmailToTutor = async (tutorEmail, tutorName, postTestTitle, studentName, sessionDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CPLH Platform" <${process.env.SMTP_USER}>`,
      to: tutorEmail,
      subject: 'Post-Test Approved - Ready for Student Assessment',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Post-Test Approved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-badge { background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            .btn { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Post-Test Approved!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${tutorName}</strong>,</p>
            
            <div class="success-badge">✅ APPROVED</div>
            
            <p>Great news! Your post-test has been reviewed and approved by the faculty.</p>
            
            <div class="info-box">
              <h3>📋 Post-Test Details:</h3>
              <p><strong>Title:</strong> ${postTestTitle}</p>
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Session Date:</strong> ${sessionDate || 'To be scheduled'}</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>The student will now see a "Take Post-Test" button in their session interface</li>
              <li>They can complete the assessment at their convenience</li>
              <li>You'll receive the results once they finish the test</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sessions/manage-post-test" class="btn">View Post-Test</a>
            
            <p>Thank you for your contribution to student assessment!</p>
            
            <div class="footer">
              <p>This is an automated message from the CPLH Platform</p>
              <p>If you have any questions, please contact the administrator</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Post-test approval email sent to tutor:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending post-test approval email to tutor:', error);
    return { success: false, error: error.message };
  }
};

// Send post-test approval email to student
const sendPostTestApprovalEmailToStudent = async (studentEmail, studentName, postTestTitle, tutorName, sessionDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CPLH Platform" <${process.env.SMTP_USER}>`,
      to: studentEmail,
      subject: 'New Post-Test Available - Assessment Ready',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Post-Test Available</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-badge { background: #17a2b8; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #17a2b8; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            .btn { background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
            .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📝 New Assessment Available!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${studentName}</strong>,</p>
            
            <div class="info-badge">📋 POST-TEST READY</div>
            
            <p>A new post-test has been approved and is now available for you to take.</p>
            
            <div class="info-box">
              <h3>📋 Assessment Details:</h3>
              <p><strong>Title:</strong> ${postTestTitle}</p>
              <p><strong>Tutor:</strong> ${tutorName}</p>
              <p><strong>Session Date:</strong> ${sessionDate || 'Scheduled session'}</p>
            </div>
            
            <div class="highlight">
              <p><strong>🎯 How to take the test:</strong></p>
              <ol>
                <li>Go to your Sessions page</li>
                <li>Look for the "Take Post-Test" button</li>
                <li>Complete the assessment when you're ready</li>
              </ol>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sessions" class="btn">Go to Sessions</a>
            
            <p>Good luck with your assessment!</p>
            
            <div class="footer">
              <p>This is an automated message from the CPLH Platform</p>
              <p>If you need help, please contact your tutor or administrator</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Post-test approval email sent to student:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending post-test approval email to student:', error);
    return { success: false, error: error.message };
  }
};

// Send faculty notification about new tutor approval
const sendFacultyTutorNotificationEmail = async (facultyEmail, facultyName, tutorName, subjectName, subjectCode) => {
  try {
    console.log(`Preparing faculty notification email for: ${facultyEmail}`);
    
    const subject = `New Tutor Approved for ${subjectName}`;
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Tutor Approved</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px 20px; }
            .content { padding: 30px; }
            .highlight { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { background-color: #f8f9fa; text-align: center; padding: 20px; border-top: 1px solid #eee; }
            .button { display: inline-block; padding: 12px 25px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 New Tutor Approved</h1>
                <p>Faculty Notification</p>
            </div>
            <div class="content">
                <p>Dear <strong>${facultyName}</strong>,</p>
                
                <p>We're pleased to inform you that a new tutor has been approved for one of your assigned subjects.</p>
                
                <div class="highlight">
                    <h3>📚 Tutor Details:</h3>
                    <p><strong>Tutor Name:</strong> ${tutorName}</p>
                    <p><strong>Subject:</strong> ${subjectName} (${subjectCode})</p>
                    <p><strong>Status:</strong> Approved and Active</p>
                </div>
                
                <p>The new tutor is now available to provide tutoring services for <strong>${subjectName}</strong> and can be assigned to students who need assistance in this subject.</p>
                
                <p>You can now:</p>
                <ul>
                    <li>View the tutor's profile and qualifications</li>
                    <li>Assign students who need tutoring in ${subjectName}</li>
                    <li>Monitor tutoring sessions and progress</li>
                    <li>Provide feedback on tutoring effectiveness</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="http://localhost:3000/dashboard" class="button">View Dashboard</a>
                    <a href="http://localhost:3000/tutors" class="button" style="background-color: #28a745;">View All Tutors</a>
                </div>
                
                <p>If you have any questions about this new tutor or need assistance with tutor assignments, please don't hesitate to contact the administration.</p>
                
                <p>Best regards,<br>
                <strong>CPLH Tutoring System</strong><br>
                Academic Support Team</p>
            </div>
            <div class="footer">
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p>&copy; 2024 CPLH Tutoring System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const result = await sendEmail(facultyEmail, subject, htmlContent);
    
    if (result.success) {
      console.log(`✅ Faculty notification email sent successfully to ${facultyEmail}`);
      return { success: true };
    } else {
      console.log(`❌ Failed to send faculty notification email: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error in sendFacultyTutorNotificationEmail:', error);
    return { success: false, error: error.message };
  }
};

// Send faculty notification about new tutor application submission
const sendFacultyNewApplicationNotificationEmail = async (facultyEmail, facultyName, applicantName, subjectName, subjectCode) => {
  try {
    console.log(`Preparing faculty new application notification email for: ${facultyEmail}`);
    
    const subject = `New Tutor Application Submitted for ${subjectName}`;
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Tutor Application</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-align: center; padding: 30px 20px; }
            .content { padding: 30px; }
            .highlight { background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { background-color: #f8f9fa; text-align: center; padding: 20px; border-top: 1px solid #eee; }
            .button { display: inline-block; padding: 12px 25px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 New Tutor Application</h1>
                <p>Faculty Review Required</p>
            </div>
            <div class="content">
                <p>Dear <strong>${facultyName}</strong>,</p>
                
                <p>A new tutor application has been submitted for one of your assigned subjects and requires your review.</p>
                
                <div class="highlight">
                    <h3>📚 Application Details:</h3>
                    <p><strong>Applicant:</strong> ${applicantName}</p>
                    <p><strong>Subject:</strong> ${subjectName} (${subjectCode})</p>
                    <p><strong>Status:</strong> Pending Review</p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <p>Please review the application at your earliest convenience. You can:</p>
                <ul>
                    <li>View the applicant's qualifications and submitted materials</li>
                    <li>Review their class card and academic information</li>
                    <li>Check their pre-assessment results (if completed)</li>
                    <li>Approve or reject the application with feedback</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="http://localhost:3000/pending-applicants" class="button">Review Applications</a>
                    <a href="http://localhost:3000/admin-dashboard" class="button" style="background-color: #6366f1;">View Dashboard</a>
                </div>
                
                <p>Your timely review helps maintain the quality of our tutoring program and ensures students receive the best possible support.</p>
                
                <p>Best regards,<br>
                <strong>CPLH Tutoring System</strong><br>
                Academic Support Team</p>
            </div>
            <div class="footer">
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p>&copy; 2024 CPLH Tutoring System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CPLH Platform" <${process.env.SMTP_USER}>`,
      to: facultyEmail,
      subject: subject,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Faculty new application notification sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error in sendFacultyNewApplicationNotificationEmail:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateTemporaryPassword,
  sendWelcomeEmail,
  sendTutorApprovalEmail,
  sendTutorRejectionEmail,
  sendMaterialApprovalEmail,
  sendMaterialRejectionEmail,
  sendPostTestApprovalEmailToTutor,
  sendPostTestApprovalEmailToStudent,
  sendFacultyTutorNotificationEmail,
  sendFacultyNewApplicationNotificationEmail,
  testEmailConnection
};
