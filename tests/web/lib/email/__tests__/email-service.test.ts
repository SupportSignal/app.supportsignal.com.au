import { MockEmailService } from '../email-service';

test('MockEmailService singleton works correctly', () => {
  const instance1 = MockEmailService.getInstance();
  const instance2 = MockEmailService.getInstance();

  expect(instance1).toBe(instance2);
});

test('MockEmailService stores and retrieves emails', async () => {
  const mockService = MockEmailService.getInstance();

  // Clear any existing emails
  mockService.clearAllEmails();

  // Send a mock email
  await mockService.sendPasswordResetEmail('test@example.com', 'test-token');

  // Check that email was stored
  const emails = mockService.getAllEmails();
  expect(emails).toHaveLength(1);
  expect(emails[0].to).toBe('test@example.com');
  expect(emails[0].token).toBe('test-token');
  expect(emails[0].subject).toBe('Password Reset Request');
});

test('MockEmailService token validation works', async () => {
  const mockService = MockEmailService.getInstance();

  // Clear any existing emails
  mockService.clearAllEmails();

  // Send a mock email
  await mockService.sendPasswordResetEmail('test@example.com', 'valid-token');

  // Check token validation
  expect(mockService.isTokenValid('valid-token')).toBe(true);
  expect(mockService.isTokenValid('invalid-token')).toBe(false);
});

test('MockEmailService can find emails by token', async () => {
  const mockService = MockEmailService.getInstance();

  // Clear any existing emails
  mockService.clearAllEmails();

  // Send a mock email
  await mockService.sendPasswordResetEmail('test@example.com', 'find-token');

  // Find email by token
  const email = mockService.getEmailByToken('find-token');
  expect(email).toBeDefined();
  expect(email!.to).toBe('test@example.com');
  expect(email!.token).toBe('find-token');

  // Should not find non-existent token
  const nonExistentEmail = mockService.getEmailByToken('non-existent');
  expect(nonExistentEmail).toBeUndefined();
});

test('MockEmailService clear functionality works', async () => {
  const mockService = MockEmailService.getInstance();

  // Clear any existing emails first
  mockService.clearAllEmails();

  // Send some emails
  await mockService.sendPasswordResetEmail('test1@example.com', 'token1');
  await mockService.sendPasswordResetEmail('test2@example.com', 'token2');

  // Verify emails exist
  expect(mockService.getAllEmails()).toHaveLength(2);

  // Clear all emails
  mockService.clearAllEmails();

  // Verify emails are cleared
  expect(mockService.getAllEmails()).toHaveLength(0);
});

test('Email templates have correct structure', async () => {
  const mockService = MockEmailService.getInstance();

  // Clear any existing emails
  mockService.clearAllEmails();

  // Send different types of emails
  await mockService.sendPasswordResetEmail('test@example.com', 'reset-token');
  await mockService.sendVerificationEmail('test@example.com', 'verify-token');

  const emails = mockService.getAllEmails();
  expect(emails).toHaveLength(2);

  // Check password reset email
  const resetEmail = emails.find(e => e.subject === 'Password Reset Request');
  expect(resetEmail).toBeDefined();
  expect(resetEmail!.body).toContain('Reset Password');
  expect(resetEmail!.body).toContain('reset-token');

  // Check verification email
  const verifyEmail = emails.find(e => e.subject === 'Email Verification');
  expect(verifyEmail).toBeDefined();
  expect(verifyEmail!.body).toContain('Verify Email');
  expect(verifyEmail!.body).toContain('verify-token');
});
