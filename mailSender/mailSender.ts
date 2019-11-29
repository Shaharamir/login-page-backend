import nodemailer from 'nodemailer';

export async function sendMail(email: string, emailToken: string) {
    const testAccount = await nodemailer.createTestAccount();
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'web.shaharamir@gmail.com',
        pass: 'Aa159263'
      }
    });
    
    const info = await transporter.sendMail({
        from: '"Login Page 👻" <login-page-admin@login-page>',
        to: email,
        subject: "Email Confirmation", // Subject line
        // text: "Hello world?", // plain text body
        html: `<b>Thank you for signing in, please click this link to confirm your email: </b> <a href="http://localhost:8080/user/confirmEmail/${emailToken}">Click me to confirm</a>` // html body
      });

      console.log("Message sent: %s", info.messageId);
      // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}