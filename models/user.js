const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  profilePicture: {
    url : String,
    filename : String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  resetPasswordToken: {
    type : String,
  },
  resetPasswordExpires: {
    type  :  Date,
  },
  otp: {
    type : String,
  },
  otpExpires: {
    type : Date,
  }
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;
