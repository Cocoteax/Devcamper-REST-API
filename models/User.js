const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
    unique: true,
    // Handle custom validation at schema level
    // NOTE: For bootcamp and course, it will be handled by checking for error code 11000 in error middleware, this is an alternate way to handle duplicate keys
    validate: [
      {
        // Validation for unique email
        validator: async function (emailValue) {
          const existingEmail = await mongoose
            .model("User")
            .findOne({ email: emailValue });
          if (existingEmail) {
            return false; // Returning false or throwing an error indicates validation failed
          }
        },
        message: "Email taken, please choose another email",
      },
    ],
  },
  role: {
    type: String,
    enum: ["user", "publisher"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minLength: [6, "Please enter a password with more than length 6"],
    select: false, // Avoid returning password when we query for user documents
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Use mongoose pre-middleware to encrypt password using bcryptjs before saving to db
UserSchema.pre("save", async function (next) {
  // To use bcryptjs, we need to generate a salt using genSalt
  // NOTE: genSalt() accepts the number of hashing rounds as an argument. 10 is sufficient
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt); // Encrypt password
  next();
});

// Schema method to sign JWT and return the token for the current document
// NOTE: "this" refers to the document in this case
UserSchema.methods.getSignedJwtToken = function () {
  // jwt.sign() accepts the payload as the first arg, secret as second arg, config object as third arg
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Schema method to validate password for the current document
// NOTE: "this" refers to document since we use a schema method
UserSchema.methods.validatePassword = async function (enteredPassword) {
  // To compare hashed passwords, use bcrypt.compare
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema, "users");
