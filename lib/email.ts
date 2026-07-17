import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvoiceEmail({
  to,
  subject,
  html,
  pdfBuffer,
  pdfFilename,
}: {
  to: string;
  subject: string;
  html: string;
  pdfBuffer?: Buffer;
  pdfFilename?: string;
}) {
  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM || `"Invoice App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  if (pdfBuffer && pdfFilename) {
    mailOptions.attachments = [
      {
        filename: pdfFilename,
        content: pdfBuffer,
      },
    ];
  }

  return transporter.sendMail(mailOptions);
}
