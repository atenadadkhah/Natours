const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');
const { response } = require('express');
const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true // cant be accessed or modified by browser
  };

  user.password = undefined;

  if (process.env.NODE_ENV === 'development') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode)
    .json({
      status: 'success',
      token
    });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) If email and password exist
  if (!email || !password) {
    return next(new AppError('Please fill out the required inputs.', 400));
  }

  // 2) if the user exists and the password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !await user.correctPassword(password, user.password)) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 3) Okay, sending the token
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  // Give it the same name (jwt) overwrites it
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Getting the token and check if it exists
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in!', 401));
  }

  // 2) Verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('User doesn\'t exist.', 401));

  // 4) Check if user changed password after token was issued
  if (user.changedPasswordAfter(decoded.iat)) return next(new AppError('Password has changed! Please login again.', 401));

  // Grant access to protected route.
  req.user = user;
  res.locals.user = user;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  try {
    let token;

    // 1) Getting the token and check if it exists
    if (req.cookies.jwt) {
      // 2) Verification
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      // 3) Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) return next();

      // 4) Check if user changed password after token was issued
      if (user.changedPasswordAfter(decoded.iat)) return next();

      // Grant access to protected route.
      res.locals.user = user; // passing data to template
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead']. role='user'
    console.log(req.user);
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You don\'t have the permission', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('Email is incorrect', 404));

  // Generate random token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it back as an email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your password and passwordConfirm to: ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token. Only valid for 10 min',
      message
    });
    res.status(200)
      .json({
        status: 'success',
        message: 'Token sent to email'
      });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(err, 500));
  }

});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  // 2) If token not expired and there is a user, set the new password

  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }

  // 3) Update the changedPasswordAt property for the user

  // 4) Log the user in, send the JWT
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if the password is correct
  if (!req.body.passwordCurrent || !await user.correctPassword(req.body.passwordCurrent, user.password)) {
    return next(new AppError('Password isn\'t correct.', 400));
  }

  // 3) Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log the user in
  createSendToken(user, 200, res);
});

