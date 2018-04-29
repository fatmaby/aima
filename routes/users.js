const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const User = require('../models/user');
const multer = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './media/profile/')
  },
  filename: function (req, file, cb) {
    cb(null, req.body.email + '_' + file.originalname);
    /*
    cb(null, req.body.email + '.' + file.originalname.split('.')[
      file.originalname.split('.').length -1
    ]);
    */
  }
});

var upload = multer({ storage: storage }).array("uploads[]", 1);

function _upload (user, req, res, next) {
  upload(req, res, function(err) {
    if(err) {
      return res.json({error_code: 1, err_desc: err});
    }
    return next();
  });
}

function _jwt (req, res, next) {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
    if (err) {
      return res.json({success: false, msg: 'Something weird just happened'});
    }

    if (user) {
      return next(user);
    } else {
      return res.json({success: false, msg: 'User session not found'});
    }
  })(req, res, next);
}

// Register
router.post('/register', (req, res, next) => {
  let newUser = new User ({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    // Remove phone number white spaces before adding.
    phoneNumber: req.body.phoneNumber.split(' ').join(''),
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth,
    bloodGroup: req.body.bloodGroup,
    userCondition: req.body.userCondition,
    governorate: req.body.governorate
  });

  User.addUser(newUser, (err, user) => {
    if (err) {
      res.json({success: false, msg: 'Failed to register user'});
    } else {
      res.json({success: true, msg: 'User registered'})
    }
  });
});

// Authenticate
router.post('/authenticate', (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.getUserByEmail(email, (err, user) => {
    if (err) throw err;

    if (!user) {
      return res.json({success: false, msg: 'User not found'})
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) throw err;

      if (isMatch) {
        const token = jwt.sign(user, config.secret, {
          expiresIn: 604800 // 1 week in seconds
        });
        res.json({
          success: true,
          token: 'JWT ' + token,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            bloodGroup: user.bloodGroup,
            userCondition: user.userCondition,
            governorate: user.governorate,
            profilePic: user.profilePic
          },
          msg: 'User logged in'
        });
      } else {
        return res.json({success: false, msg: 'Wrong password'});
      }
    });
  });
});

// Update user details
router.post('/update', _jwt, (user, req, res, next) => {
  User.updateUserByEmail(req.body, (err, doc) => {
    if (err) throw err;

    if (!doc) {
      return res.json({success: false, msg: 'User not found'})
    } else {
      res.json({
        success: true,
        msg: 'User profile details updated successfully',
        user: doc
      });
    }
  });
});

// Upload user profile picture
router.post("/upload", _jwt, _upload, (req, res) => {
  User.updateUserProfilePicture(req.body, (err, doc) => {
    if (err) throw err;

    if (!doc) {
      return res.json({success: false, msg: 'User not found'})
    } else {
      res.json({
        success: true,
        msg: 'User profile picture uploaded successfully',
        user: doc
      });
    }
  });
});

// Verfiy if a user session is still valid
router.get('/session', _jwt, (user, req, res, next) => {
  res.json({success: true, msg: 'User session exists'});
});

// Get user profile
router.get('/profile', _jwt, (user, req, res, next) => {
  res.json({success: true, user: user});
});

// Get donors list
router.get('/donors', _jwt, (user, req, res, next) => {
  User._find({userCondition: 'Donneur'}, (err, docs) => {
    if (err) throw err;

    if (docs && docs.length !== 0) {
      res.json({ success: true, msg: 'Donors list', docs: docs});
    } else {
      res.json({success: false, msg: 'There is no donor'});
    }
  });
});

// Get critical conditon list
router.get('/critical', (req, res, next) => {
  User._find({userCondition: 'En urgence'}, (err, docs) => {
    if (err) throw err;

    if (docs && docs.length !== 0) {
      res.json({ success: true, msg: 'Critical list', docs: docs});
    } else {
      res.json({success: false, msg: 'There is no critcal cases'});
    }
  });
});

// Get recipent conditon list
router.get('/recipients', (req, res, next) => {
  User._find({userCondition: 'En besoin'}, (err, docs) => {
    if (err) throw err;

    if (docs && docs.length !== 0) {
      res.json({ success: true, msg: 'Recipients list', docs: docs});
    } else {
      res.json({success: false, msg: 'There are no recipients'});
    }
  });
});

module.exports = router;
