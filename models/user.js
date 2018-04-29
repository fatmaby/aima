const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

// User Schema
const UserSchema = mongoose.Schema({
  firstName: {
    type: String,
    match: [
      /^((\s)*[a-zA-Z]{2,}(\s)*){1,}$/,
      'Prénom non valide'],
    trim: true,
    uppercase: true,
    required: true
  },
  lastName: {
    type: String,
    match: [
      /^((\s)*[a-zA-Z]{2,}(\s)*){1,}$/,
      'Nom non valide'
    ],
    trim: true,
    uppercase: true,
    required: true
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Adresse e-mail non valide'
    ],
    trim: true,
    lowercase: true,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    match: [
      /\d{8}/,
      'Numéro de téléphone non valide'
    ],
    trim: true,
    required: true
  },
  // Optional but needed
  gender: {
    type: String,
    enum: ['Homme', 'Femme']
  },
  dateOfBirth: {
    type: Date
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  userCondition: {
    type: String,
    enum: ['Donneur', 'En besoin', 'En urgence']
  },
  governorate: {
    type: String,
    enum: [
      'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
      'Jendouba', 'Kairouan', 'Kasserine', 'Kebili', 'Kef', 'Mahdia',
      'Manouba', 'Medenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
      'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
    ]
  },
  // Optional
  profilePic: {
    type: String
  }
});

const User = module.exports = mongoose.model('User', UserSchema);

// getUserById
module.exports.getUserById = function(id, callback) {
  User.findById(id, callback);
}

// getUserByEmail
module.exports.getUserByEmail = function(email, callback) {
  const query = {email: email}
  User.findOne(query, callback);
}

// addUser
module.exports.addUser = function (newUser, callback) {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      newUser.save(callback);
    });
  });
}

// updateUserByEmail
module.exports.updateUserByEmail = function (userUpdate, callback) {
  const query = { email: userUpdate.email }
  const options = { new: true, runValidators: true }
  User.findOneAndUpdate(query, userUpdate, options, callback);
}

// updateUserProfilePicture
module.exports.updateUserProfilePicture = function (userProfilePic, callback) {
  /*
  let profilePic = userProfilePic.email + '.' + userProfilePic.fileName.split('.')[
    userProfilePic.fileName.split('.').length -1
  ]
  */
  const profilePic = userProfilePic.email + '_' + userProfilePic.fileName;
  const query = { email: userProfilePic.email }
  const options = { new: true, runValidators: true }
  User.findOneAndUpdate(query, { profilePic: profilePic }, options, callback);
}

// comparePassword
module.exports.comparePassword = function (candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if (err) throw err;
    callback(null, isMatch);
  });
}

module.exports._find = function (query, callback) {
  User.find(query, function(err, docs) {
    if (err) throw err;
  }).select(
    `email firstName lastName
    gender governorate dateOfBirth
    bloodGroup phoneNumber userCondition
    profilePic`).exec(callback);
}
