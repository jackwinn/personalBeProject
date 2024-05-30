//package
const bycrpt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// model
const userModel = require("../models/userModel");

//lib
const db = require("../libs/db");
const lib = require("../libs/lib");

const isEmailUnique = async (email, role) => {
  // console.log(email, role)
  let match = {
    "personal.email": email,
    role: role,
  };

  try {
    const result = await userModel.findOne(match);
    // console.log(result)
    return result ? false : true;
  } catch (err) {
    throw err;
  }
};

//get user password, hash it, then save it to users table
exports.create = async (email, password, role) => {
  const isAccountUnique = await isEmailUnique(email, role);
  // console.log(isAccountUnique)
  if (isAccountUnique) {
    //default value is 10, the larger the number the longer its going to take to generate hash, but the more secure will be
    // const salt = await bycrpt.genSalt(10);
    //append salt to password to hash password
    // const hashedPassword = await bycrpt.hash(password, salt);
    const hashedPassword = await bycrpt.hash(password, 10); //shorthand method

    const userParams = {
      _id: db.newId(),
      personal: {
        email: email,
        password: hashedPassword,
      },
      role: role,
    };
    const newUser = new userModel(userParams);
    try {
      const result = await newUser.save();
      // console.log(result)
      if (result) {
        return {
          message: "Your account has been created",
        };
      }
    } catch (err) {
      throw err;
    }
  } else {
    return {
      message: "The email is already associated with an account",
    };
  }
};

//authenticate user
exports.login = async (email, password, role) => {
  let pipeline = [
    {
      $match: {
        "personal.email": new RegExp(lib.autoEscapeRegExp(email), "i"),
        role: role,
      },
    },
  ];

  try {
    const [currentUser] = await userModel.aggregate(pipeline);
    // console.log(user);
    if (currentUser) {
      const isPasswordMatch = await bycrpt.compare(
        password,
        currentUser.personal.password
      );
      if (isPasswordMatch) {
        const token = jwt.sign(
          { userId: currentUser._id, role: currentUser.role },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '1h' }
        );

        const update = {
          lastLogin: new Date(),
        };

        let updatedUser = await userModel.findByIdAndUpdate(
          currentUser._id,
          update,
          db.updateOption
        );
        //convert mongoose document to a plain javascript object, findByIdAndUpdate return immutable object
        // updatedUser = updatedUser.toObject()
        //remove sensitive or unused information
        // delete updatedUser.created;
        // delete updatedUser.updated;

        // updatedUser.token = token

        return { token: token };
      } else {
        return {
          message: "You have entered an invalid password",
        };
      }
    } else {
      return {
        message: "There is no account associated with this email address",
      };
    }
  } catch (err) {
    throw err;
  }
};

//get user by id
exports.getById = async (id) => {
  try {
    const result = await userModel.findById(id);
    return result;
  } catch (err) {
    throw err;
  }
};


