const nodemailer = require('nodemailer')

const sendEmail = async options => {
  // 1) Transporter
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "1dee357fa777fd",
      pass: "5b510adbe375c7"
    }
  });

  // 2) Email options
  const mailOptions = {
    from: 'Atena Dadkhah <atena.dadkhah86@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  }

  // 3) Send the email
  await transporter.sendMail(mailOptions)

}

module.exports = sendEmail