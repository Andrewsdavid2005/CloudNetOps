/**
 * Placeholder utility for sending alert-related email notifications.
 * In a production system, this would integrate with an email service
 * like SendGrid, SES, or SMTP. For now it simply logs the payload.
 *
 * @param {Object} payload - Information about the alert event.
 *   Expected fields: id, deviceId, severity, message, action (e.g., 'dismissed')
 */
function sendAlertEmail(payload) {
  // TODO: integrate real email service
  console.log('[Email] Alert notification placeholder:', payload);
}

module.exports = { sendAlertEmail };
