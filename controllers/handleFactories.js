const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req , res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id)
  if (!doc) {
    return next(new AppError('No document found.',404))
  }
  res.status(204)
    .json({
      status: 'Successful',
      data: null
    })
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: false,
  })
  if (!doc) {
    return next(new AppError('No document found',404))
  }
  res.status(200)
    .json({
      status: 'Successful',
      data: {
        data: doc
      }
    })
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
  const newDoc = await Model.create(req.body)
  res.status(201)
    .json({
      status: "Success",
      data: {
        data: newDoc
      }
    })
})

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
  let query = Model.findById(req.params.id)
  if (populateOptions) query.populate(populateOptions)
  const doc = await query
  if (!doc) {
    return next(new AppError('no tour found',404))
  }
  res.status(200)
    .json({
      status : 'success',
      data : {
        data: doc
      }
    });
})

exports.getAll = Model => catchAsync(async (req, res, next) => {
  // To allow nested routes to GET tour reviews
  let filter = {}
  if (req.params.tourId) filter = { tour: req.params.tourId }

  // Execute query
  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
  const docs = await features.query //.explain()

  // Send response
  res.status(200)
    .json({
      status: 'success',
      time: req.requestTime,
      results: docs.length,
      data: {
        data: docs
      }
    })
})