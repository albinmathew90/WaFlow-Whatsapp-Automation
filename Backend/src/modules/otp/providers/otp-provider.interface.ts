export interface OtpProvider {
  /**
   * Send the OTP message using the underlying provider.
   * @param to Phone number or email address
   * @param text The rendered message content
   * @param senderConfig Configuration for the sender (e.g., sessionId, fromEmail)
   * @returns An object containing success status and provider-specific message ID
   */
  sendOtp(to: string, text: string, senderConfig: any): Promise<{ success: boolean; messageId: string }>;
}
