export interface EmailTemplate {
  subject: string;
  body: string;
}

export function getPasswordResetTemplate(resetUrl: string): EmailTemplate {
  return {
    subject: 'Password Reset Request',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .button { 
            background-color: #4F46E5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          
          <p>You requested a password reset for your account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>This link will expire in 1 hour.</p>
          
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <div class="footer">
            <p><strong>Development Mode:</strong> This is a mock email for development purposes.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function getEmailVerificationTemplate(verifyUrl: string): EmailTemplate {
  return {
    subject: 'Email Verification',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .button { 
            background-color: #10B981; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          
          <p>Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email</a>
          </div>
          
          <p>This link will expire in 24 hours.</p>
          
          <div class="footer">
            <p><strong>Development Mode:</strong> This is a mock email for development purposes.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}
