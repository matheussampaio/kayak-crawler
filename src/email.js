import Nodemailer from 'nodemailer';

import { email, password } from '../.env.json';

export default class Email {
  constructor() {
    this.user = process.env.USER_EMAIL || email;
    this.password = process.env.USER_PASSWORD || password;

    this.transporter = Nodemailer.createTransport(`smtps://${this.user}%40gmail.com:${this.password}@smtp.gmail.com`);
  }

  send(text) {
    const mailOptions = {
      from: `"Kayak Crawler" <kayak@crawler.com>`, // sender address
      to: `${this.user}@gmail.com`, // list of receivers
      subject: `Kayak - Today`, // Subject line
      text: `${text}`, // plaintext body
      html: `${text}` // html body
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  }
}
