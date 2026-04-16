const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM || 'support@ronix.gg';
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO || 'support@ronix.gg';
const SMTP_USER = process.env.EMAIL_SMTP_USER || ALERT_EMAIL_FROM;
const SMTP_PASS = process.env.EMAIL_SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true, // true for port 465 (SSL/TLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

function sendAlertEmail(mailOptions) {
  if (!SMTP_PASS) {
    return null;
  }
  return transporter.sendMail(mailOptions);
}

/**
 * Cloud Function to trigger on new user signup.
 * Sends an email alert to the specified address.
 */
exports.sendNewUserAlert = functions.auth.user().onCreate((user) => {
  const mailOptions = {
    from: ALERT_EMAIL_FROM,
    to: ALERT_EMAIL_TO,
    subject: 'New User Signup',
    text: `A new user has signed up!\n\nEmail: ${user.email || 'No email provided'}\nUID: ${user.uid}`
  };

  return sendAlertEmail(mailOptions);
});

// Firestore trigger for new user documents
exports.notifyOnNewUserDocument = functions.firestore
  .document('users/{userId}')
  .onCreate((snap, context) => {
    const userData = snap.data();
    const mailOptions = {
      from: ALERT_EMAIL_FROM,
      to: ALERT_EMAIL_TO,
      subject: 'New User Document Created',
      text: `A new user document was created in Firestore!\n\nUser ID: ${context.params.userId}\nData: ${JSON.stringify(userData, null, 2)}`
    };

    return sendAlertEmail(mailOptions);
  });
