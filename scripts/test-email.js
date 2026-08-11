const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_USERNAME = process.env.SMTP_USERNAME || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";

async function test(port, secure, pass, label) {
  console.log(`Testing SMTP connection on port ${port} (secure=${secure}) with: ${label}`);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: port,
    secure: secure,
    auth: {
      user: SMTP_USERNAME,
      pass: pass,
    },
  });

  try {
    await transporter.verify();
    console.log(`✓ Success on port ${port}`);
    return true;
  } catch (err) {
    console.error(`✗ Failed on port ${port}. Error:`, err.message);
    return false;
  }
}

async function run() {
  if (!SMTP_USERNAME || !SMTP_PASSWORD) {
    console.error("Please set SMTP_USERNAME and SMTP_PASSWORD environment variables.");
    process.exit(1);
  }
  await test(465, true, SMTP_PASSWORD, "Standard credentials");
  await test(587, false, SMTP_PASSWORD, "Port 587 credentials");
}

run();
