'use client';

import React, { useState, useEffect } from 'react';
import { mockEmailService, MockEmail } from '../../lib/email/email-service';

export function MockEmailViewer() {
  const [emails, setEmails] = useState<MockEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load emails initially
    loadEmails();

    // Set up interval to refresh emails every 2 seconds
    const interval = setInterval(loadEmails, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadEmails = () => {
    const allEmails = mockEmailService.getAllEmails();
    setEmails(allEmails);
  };

  const handleClearEmails = () => {
    mockEmailService.clearAllEmails();
    setEmails([]);
    setSelectedEmail(null);
  };

  const copyResetLink = (email: MockEmail) => {
    const resetUrl = `${window.location.origin}/reset-password?token=${email.token}`;
    navigator.clipboard.writeText(resetUrl);
    alert('Reset link copied to clipboard!');
  };

  const isTokenExpired = (email: MockEmail) => {
    return email.expiresAt < new Date();
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
        >
          📧 Mock Emails ({emails.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[80vh] w-full flex overflow-hidden">
        {/* Email List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mock Emails</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={handleClearEmails}
                className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
              >
                Clear All
              </button>
              <button
                onClick={loadEmails}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                No mock emails sent yet
              </div>
            ) : (
              emails.map(email => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedEmail?.id === email.id
                      ? 'bg-blue-50 border-blue-200'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {email.subject}
                    </div>
                    {isTokenExpired(email) && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{email.to}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {email.sentAt.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Content */}
        <div className="w-2/3 flex flex-col">
          {selectedEmail ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h4 className="font-semibold text-gray-900">
                  {selectedEmail.subject}
                </h4>
                <div className="text-sm text-gray-600 mt-1">
                  <div>To: {selectedEmail.to}</div>
                  <div>Sent: {selectedEmail.sentAt.toLocaleString()}</div>
                  <div>Expires: {selectedEmail.expiresAt.toLocaleString()}</div>
                  <div className="mt-2">
                    <button
                      onClick={() => copyResetLink(selectedEmail)}
                      className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                    >
                      Copy Reset Link
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select an email to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
