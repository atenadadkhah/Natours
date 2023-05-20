const Tour = require('./../models/tourModel')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

exports.getOverview = async (req, res, next) => {
  const tours = await Tour.find()
  res.status(200).render('overview', { title: 'خانه', tours })
}

exports.getTour = async (req, res, next) => {
  const tour = await Tour
    .findOne({ slug: req.params.slug })
    .populate('reviews')

  if (!tour) return next(new AppError('There is no tour with that name.', 404))

  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', { title: tour.name, tour })
}

exports.getLoginForm = async (req, res, next) => {
  res.status(200).render('login', { title: 'Login' })
}

exports.getAccount = async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account'
  })
}

exports.updateUserData = async (req, res, next) => {
  const { email, name } = req.body
  console.log(email, name);
  const user = await User.findByIdAndUpdate(req.user.id, { email, name }, {
    new: true,
    runValidators: true
  })
  res.status(200).render('account', {
    title: 'Your account',
    user
  })
}