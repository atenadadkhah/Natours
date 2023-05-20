const Review = require('./../models/reviewModel')
const factory = require('./handleFactories')

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId
  if (!req.body.user) req.body.user = req.user.id
  next()
}

exports.getAllReviews = factory.getAll(Review)

exports.createReview = factory.createOne(Review)

exports.updateReview = factory.updateOne(Review)

exports.deleteReview = factory.deleteOne(Review)

exports.getReview = factory.getOne(Review)