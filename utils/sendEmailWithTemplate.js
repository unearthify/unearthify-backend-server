const transporter = require("../config/mailer");
const generateEmailTemplate = require("../templates/dynamicEmailTemplate");

const sendEmailWithTemplate = async ({ type, role, to, subject, data }) => {
  const html = generateEmailTemplate({ type, role, data });

  await transporter.sendMail({
    from: `"Unearthify" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmailWithTemplate;