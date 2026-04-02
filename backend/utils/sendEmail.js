const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // If no real SMTP is provided, we use Ethereal (A fake SMTP service for testing)
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
          }
      });
  } else {
      // Fallback: Generate an automatic testing account
      console.log('No SMTP config found in .env, generating automatic Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
              user: testAccount.user,
              pass: testAccount.pass
          }
      });
  }

  const message = {
      from: `${process.env.FROM_NAME || 'KeeStore Security'} <${process.env.FROM_EMAIL || 'noreply@keestore.com'}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
  };

  const info = await transporter.sendMail(message);

  if (!process.env.SMTP_HOST) {
     console.log('----------------------------------------------------');
     console.log('Automatic Testing Email Sent!');
     console.log('Preview URL (Click here to read): %s', nodemailer.getTestMessageUrl(info));
     console.log('----------------------------------------------------');
  }
};

module.exports = sendEmail;
