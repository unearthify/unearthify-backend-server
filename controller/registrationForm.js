const Registration = require("../model/registration");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET;

// --- CRUD Operations ---

// 1. Create (Register)
const registerPost = async (req, res) => {
  try {
    const { FirstName, LastName, Email, Password } = req.body;

    // Check validation
    if (!FirstName || !LastName || !Email || !Password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await Registration.findOne({ Email });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const hashPassword = await bcrypt.hash(Password, 10);

    const newRegistration = new Registration({
      FirstName,
      LastName,
      Email,
      Password: hashPassword,
      status: "pending", // Default status
    });

    await newRegistration.save();

    res.status(201).json({
      message: "Registration successful",
      data: {
        _id: newRegistration._id,
        FirstName: newRegistration.FirstName,
        LastName: newRegistration.LastName,
        Email: newRegistration.Email,
        status: newRegistration.status,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ Error: error.message });
  }
};

// 2. Read (Get All Users) - mapped to /userData
const getUser = async (req, res) => {
  try {
    const userData = await Registration.find().select("-Password");
    res.json({ data: userData });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ Error: error.message });
  }
};


const getUserData = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const user = await Registration.findById(req.user.id).select("-Password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get User Data Error:", error);
    res.status(500).json({ Error: error.message });
  }
};


const login = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({ message: "Email and Password are required." });
    }

    const dataUser = await Registration.findOne({ Email });

    if (!dataUser) {
      return res.status(400).json({ message: "User not found." });
    }

    const validPassword = await bcrypt.compare(Password, dataUser.Password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password." });
    }

    const token = jwt.sign(
      { id: dataUser._id, email: dataUser.Email },
      secretKey,
      { expiresIn: "24h" }
    );

    res.status(200).json({ token, user: {
        id: dataUser._id,
        FirstName: dataUser.FirstName,
        LastName: dataUser.LastName,
        Email: dataUser.Email
    }});
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



// --- Password Reset ---

const Forgot = async (req, res) => {
  const { Email } = req.body;
  try {
    const user = await Registration.findOne({ Email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "serviceuse66@gmail.com", // Keeping original credentials as requested implicitely
        pass: "lpww malh pupq jafg",
      },
      tls: { ciphers: "SSLv3" },
    });

    const resetLink = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}/reset-password/${token}`;

    const mailOptions = {
      from: "serviceuse66@gmail.com",
      to: Email,
      subject: "Password Reset",
      html: `<p>You requested a password reset</p>
             <p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset link sent to your email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const Reset = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    const user = await Registration.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.Password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  registerPost,
  login,
  getUser,
  getUserData,
  Forgot,
  Reset
};
