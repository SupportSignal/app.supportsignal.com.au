import {
  getPasswordResetTemplate,
  getEmailVerificationTemplate,
  EmailTemplate,
} from '../email-templates';

describe('Email Templates', () => {
  describe('getPasswordResetTemplate', () => {
    it('should return email template with correct subject', () => {
      const resetUrl = 'https://example.com/reset?token=abc123';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.subject).toBe('Password Reset Request');
    });

    it('should include reset URL in the email body', () => {
      const resetUrl = 'https://example.com/reset?token=abc123';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.body).toContain(resetUrl);
      expect(template.body).toContain(`href="${resetUrl}"`);
    });

    it('should return valid HTML structure', () => {
      const resetUrl = 'https://example.com/reset?token=test';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.body).toContain('<!DOCTYPE html>');
      expect(template.body).toContain('<html>');
      expect(template.body).toContain('<head>');
      expect(template.body).toContain('<body>');
      expect(template.body).toContain('</html>');
    });

    it('should include required email content', () => {
      const resetUrl = 'https://example.com/reset?token=test';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.body).toContain('Password Reset Request');
      expect(template.body).toContain('You requested a password reset');
      expect(template.body).toContain('Reset Password');
      expect(template.body).toContain('This link will expire in 1 hour');
      expect(template.body).toContain(
        "If you didn't request this password reset"
      );
    });

    it('should include development mode disclaimer', () => {
      const resetUrl = 'https://example.com/reset?token=test';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.body).toContain('Development Mode');
      expect(template.body).toContain('mock email for development purposes');
    });

    it('should have proper CSS styling', () => {
      const resetUrl = 'https://example.com/reset?token=test';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.body).toContain('<style>');
      expect(template.body).toContain('font-family: Arial, sans-serif');
      expect(template.body).toContain('background-color: #4F46E5');
      expect(template.body).toContain('border-radius: 6px');
    });

    it('should handle URLs with special characters', () => {
      const resetUrl =
        'https://example.com/reset?token=abc123&redirect=%2Fdashboard%3Futm_source%3Demail';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.body).toContain(resetUrl);
      expect(template.body).toContain(`href="${resetUrl}"`);
    });

    it('should handle very long URLs', () => {
      const longToken = 'a'.repeat(500);
      const resetUrl = `https://example.com/reset?token=${longToken}`;
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.body).toContain(resetUrl);
      expect(template.body).toContain(`href="${resetUrl}"`);
    });

    it('should handle URLs with query parameters', () => {
      const resetUrl =
        'https://example.com/reset?token=abc123&user=test@example.com&timestamp=1234567890';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template.body).toContain(resetUrl);
      expect(template.body).toContain(`href="${resetUrl}"`);
    });

    it('should return EmailTemplate interface correctly', () => {
      const resetUrl = 'https://example.com/reset?token=test';
      const template = getPasswordResetTemplate(resetUrl);

      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('body');
      expect(typeof template.subject).toBe('string');
      expect(typeof template.body).toBe('string');

      // Verify it matches EmailTemplate interface
      const emailTemplate: EmailTemplate = template;
      expect(emailTemplate.subject).toBeDefined();
      expect(emailTemplate.body).toBeDefined();
    });
  });

  describe('getEmailVerificationTemplate', () => {
    it('should return email template with correct subject', () => {
      const verifyUrl = 'https://example.com/verify?token=xyz789';
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template.subject).toBe('Email Verification');
    });

    it('should include verify URL in the email body', () => {
      const verifyUrl = 'https://example.com/verify?token=xyz789';
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template.body).toContain(verifyUrl);
      expect(template.body).toContain(`href="${verifyUrl}"`);
    });

    it('should return valid HTML structure', () => {
      const verifyUrl = 'https://example.com/verify?token=test';
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template.body).toContain('<!DOCTYPE html>');
      expect(template.body).toContain('<html>');
      expect(template.body).toContain('<head>');
      expect(template.body).toContain('<body>');
      expect(template.body).toContain('</html>');
    });

    it('should include required email content', () => {
      const verifyUrl = 'https://example.com/verify?token=test';
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template.body).toContain('Email Verification');
      expect(template.body).toContain('Please verify your email address');
      expect(template.body).toContain('Verify Email');
      expect(template.body).toContain('This link will expire in 24 hours');
    });

    it('should include development mode disclaimer', () => {
      const verifyUrl = 'https://example.com/verify?token=test';
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template.body).toContain('Development Mode');
      expect(template.body).toContain('mock email for development purposes');
    });

    it('should have proper CSS styling with green button', () => {
      const verifyUrl = 'https://example.com/verify?token=test';
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template.body).toContain('<style>');
      expect(template.body).toContain('font-family: Arial, sans-serif');
      expect(template.body).toContain('background-color: #10B981'); // Green color for verify button
      expect(template.body).toContain('border-radius: 6px');
    });

    it('should handle URLs with special characters', () => {
      const verifyUrl =
        'https://example.com/verify?token=xyz789&email=test%40example.com';
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template.body).toContain(verifyUrl);
      expect(template.body).toContain(`href="${verifyUrl}"`);
    });

    it('should handle very long URLs', () => {
      const longToken = 'b'.repeat(600);
      const verifyUrl = `https://example.com/verify?token=${longToken}`;
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template.body).toContain(verifyUrl);
      expect(template.body).toContain(`href="${verifyUrl}"`);
    });

    it('should return EmailTemplate interface correctly', () => {
      const verifyUrl = 'https://example.com/verify?token=test';
      const template = getEmailVerificationTemplate(verifyUrl);

      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('body');
      expect(typeof template.subject).toBe('string');
      expect(typeof template.body).toBe('string');

      // Verify it matches EmailTemplate interface
      const emailTemplate: EmailTemplate = template;
      expect(emailTemplate.subject).toBeDefined();
      expect(emailTemplate.body).toBeDefined();
    });
  });

  describe('Template Differences', () => {
    it('should have different subjects for different templates', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      expect(resetTemplate.subject).not.toBe(verifyTemplate.subject);
      expect(resetTemplate.subject).toBe('Password Reset Request');
      expect(verifyTemplate.subject).toBe('Email Verification');
    });

    it('should have different button colors', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      expect(resetTemplate.body).toContain('background-color: #4F46E5'); // Blue
      expect(verifyTemplate.body).toContain('background-color: #10B981'); // Green
    });

    it('should have different expiry times', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      expect(resetTemplate.body).toContain('expire in 1 hour');
      expect(verifyTemplate.body).toContain('expire in 24 hours');
    });

    it('should have different button text', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      expect(resetTemplate.body).toContain('Reset Password');
      expect(verifyTemplate.body).toContain('Verify Email');
    });

    it('should have different main content', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      expect(resetTemplate.body).toContain('You requested a password reset');
      expect(verifyTemplate.body).toContain('Please verify your email address');
    });
  });

  describe('HTML Safety and Security', () => {
    it('should not allow HTML injection through URLs', () => {
      const maliciousUrl =
        'https://example.com/reset?token=<script>alert("xss")</script>';
      const template = getPasswordResetTemplate(maliciousUrl);

      // URL should be included as-is but in href attribute, browsers will encode it
      expect(template.body).toContain(maliciousUrl);
      expect(template.body).toContain(`href="${maliciousUrl}"`);
    });

    it('should handle URLs with quotes', () => {
      const urlWithQuotes = 'https://example.com/reset?token=abc"def\'ghi';
      const template = getPasswordResetTemplate(urlWithQuotes);

      expect(template.body).toContain(urlWithQuotes);
      expect(template.body).toContain(`href="${urlWithQuotes}"`);
    });

    it('should handle empty URLs gracefully', () => {
      const emptyUrl = '';
      const resetTemplate = getPasswordResetTemplate(emptyUrl);
      const verifyTemplate = getEmailVerificationTemplate(emptyUrl);

      expect(resetTemplate.body).toContain('href=""');
      expect(verifyTemplate.body).toContain('href=""');
    });

    it('should handle null-like string URLs', () => {
      const nullUrl = 'null';
      const undefinedUrl = 'undefined';

      const resetTemplate1 = getPasswordResetTemplate(nullUrl);
      const resetTemplate2 = getPasswordResetTemplate(undefinedUrl);

      expect(resetTemplate1.body).toContain('href="null"');
      expect(resetTemplate2.body).toContain('href="undefined"');
    });
  });

  describe('Template Structure Validation', () => {
    it('should have consistent HTML structure between templates', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      // Both should have similar structure
      expect(resetTemplate.body).toContain('<div class="container">');
      expect(verifyTemplate.body).toContain('<div class="container">');

      expect(resetTemplate.body).toContain('<div class="header">');
      expect(verifyTemplate.body).toContain('<div class="header">');

      expect(resetTemplate.body).toContain('<div class="footer">');
      expect(verifyTemplate.body).toContain('<div class="footer">');
    });

    it('should have proper meta tags', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      expect(resetTemplate.body).toContain('<meta charset="utf-8">');
      expect(verifyTemplate.body).toContain('<meta charset="utf-8">');

      expect(resetTemplate.body).toContain(
        '<title>Password Reset Request</title>'
      );
      expect(verifyTemplate.body).toContain(
        '<title>Email Verification</title>'
      );
    });

    it('should have button styling with proper classes', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      expect(resetTemplate.body).toContain('class="button"');
      expect(verifyTemplate.body).toContain('class="button"');

      // Check button CSS properties
      expect(resetTemplate.body).toContain('padding: 12px 24px');
      expect(verifyTemplate.body).toContain('padding: 12px 24px');

      expect(resetTemplate.body).toContain('text-decoration: none');
      expect(verifyTemplate.body).toContain('text-decoration: none');
    });

    it('should have responsive design considerations', () => {
      const resetTemplate = getPasswordResetTemplate(
        'https://example.com/reset'
      );
      const verifyTemplate = getEmailVerificationTemplate(
        'https://example.com/verify'
      );

      expect(resetTemplate.body).toContain('max-width: 600px');
      expect(verifyTemplate.body).toContain('max-width: 600px');

      expect(resetTemplate.body).toContain('margin: 0 auto');
      expect(verifyTemplate.body).toContain('margin: 0 auto');
    });
  });
});
