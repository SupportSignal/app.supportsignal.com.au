export interface EmailService {
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendVerificationEmail(email: string, token: string): Promise<void>;
}

export interface MockEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  token: string;
  expiresAt: Date;
  sentAt: Date;
}

export class MockEmailService implements EmailService {
  private static instance: MockEmailService;
  private emails: MockEmail[] = [];

  private constructor() {}

  static getInstance(): MockEmailService {
    if (!MockEmailService.instance) {
      MockEmailService.instance = new MockEmailService();
    }
    return MockEmailService.instance;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${token}`;

    const mockEmail: MockEmail = {
      id:
        typeof crypto !== 'undefined'
          ? crypto.randomUUID()
          : `mock-${Date.now()}-${Math.random()}`,
      to: email,
      subject: 'Password Reset Request',
      body: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr>
        <p><small>This is a development email. In production, this would be sent via email service.</small></p>
      `,
      token,
      expiresAt,
      sentAt: new Date(),
    };

    this.emails.push(mockEmail);
    this.logEmailToConsole(mockEmail);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000';
    const verifyUrl = `${origin}/verify-email?token=${token}`;

    const mockEmail: MockEmail = {
      id:
        typeof crypto !== 'undefined'
          ? crypto.randomUUID()
          : `mock-${Date.now()}-${Math.random()}`,
      to: email,
      subject: 'Email Verification',
      body: `
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
        <hr>
        <p><small>This is a development email. In production, this would be sent via email service.</small></p>
      `,
      token,
      expiresAt,
      sentAt: new Date(),
    };

    this.emails.push(mockEmail);
    this.logEmailToConsole(mockEmail);
  }

  private logEmailToConsole(email: MockEmail): void {
    /* eslint-disable no-console */
    console.log('📧 MOCK EMAIL SENT');
    console.log('==================');
    console.log(`To: ${email.to}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Token: ${email.token}`);
    console.log(`Expires: ${email.expiresAt.toISOString()}`);
    console.log(`Sent: ${email.sentAt.toISOString()}`);
    console.log('Body:');
    console.log(email.body);
    console.log('==================');
    /* eslint-enable no-console */
  }

  // Development methods for viewing mock emails
  getAllEmails(): MockEmail[] {
    return [...this.emails].sort(
      (a, b) => b.sentAt.getTime() - a.sentAt.getTime()
    );
  }

  getEmailById(id: string): MockEmail | undefined {
    return this.emails.find(email => email.id === id);
  }

  getEmailByToken(token: string): MockEmail | undefined {
    return this.emails.find(email => email.token === token);
  }

  isTokenValid(token: string): boolean {
    const email = this.getEmailByToken(token);
    if (!email) return false;
    return email.expiresAt > new Date();
  }

  clearAllEmails(): void {
    this.emails = [];
    // eslint-disable-next-line no-console
    console.log('🗑️ All mock emails cleared');
  }
}

// Factory function to get the appropriate email service
export function getEmailService(): EmailService {
  // In development, use mock email service
  // In production, this would return a real email service
  return MockEmailService.getInstance();
}

export const mockEmailService = MockEmailService.getInstance();
