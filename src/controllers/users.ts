import connection from "../connection/connection";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { Encrypt } from "../authentication/password-encryption";
const dotenv = require("dotenv");
dotenv.config();
// create user
export let createUser = async (
  req: Request,
  res: Response
) => {
  const date = Date.now() + 3600000; // 1 hour
  const token = uuidv4();
  connection.query(
    "INSERT INTO users SET ?",
    {
      username: req.body.username,
      email: req.body.email,
      phone_no: req.body.phone,
      password: await Encrypt.cryptPassword(req.body.password),
      expire_token: new Date(date),
      token: token,
      status: req.body.status,
    },
    function (error, results) {
      if (error)  res
      .status(422)
      .send({ message: "Unable to Create Account", is_success: false });;
      if (results.insertId) {
        sendEmail(req.body.email, res, token, results);
        res.status(200).send({ message: "user created successfully" ,is_success:true});
      }
    }
  );
};

export const activateUserAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  connection.query(
    "SELECT * FROM users WHERE token = ?",
    [req.body.token],
    function (error, results) {
      if (error)
        res
          .status(422)
          .send({ message: "User Information Not found", is_success: false });
      if (results[0] && results[0].token) {
        connection.query(
          "UPDATE users SET status = ?, token= '',expire_token='' WHERE id = ?",
          [true, results[0].id],
          function (error, results) {
            if (error)
              res
                .status(422)
                .send({ message: "Erro In Updating User", is_success: false });
            res
              .status(200)
              .send({ message: "Account Has Been Verified", is_success: true });
          }
        );
      } else {
        res
          .status(422)
          .send({ message: "User Information Not found", is_success: false });
      }
    }
  );
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [req.body.email],
    async function (error, results) {
      if (error)
        res
          .status(422)
          .send({ message: "User Information Not found", is_success: false });

      if (results[0] && results[0].status) {
        const password_match = await Encrypt.comparePassword(
          req.body.password,
          results[0].password
        );
        if (password_match) {
          res
            .status(200)
            .send({
              user: results[0],
              message: "Account Has Been Verified",
              is_success: true,
            });
        } else {
          res
            .status(422)
            .send({ message: "User Password Mismatch", is_success: false });
        }
      } else {
        res
          .status(422)
          .send({ message: "User Information Not found", is_success: false });
      }
    }
  );
};
function sendEmail(email, res, token, user) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.user,
      pass: process.env.pass,
    },
  });
  const mailOptions = {
    to: email,
    from: process.env.user,
    subject: "Confirm Account Verification",
    text: `You are receiving this email because you (or someone else) have requested the account activation.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${process.env.frontendUrl}/${token}\n\n
      If you did not request this, please ignore this email.\n`,
  };
  transporter.sendMail(mailOptions, function (err, data) {
    if (err) {
      console.log("Error Occurs", err);
    }
  });
}
