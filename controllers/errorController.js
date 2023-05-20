const AppError = require('./../utils/appError')

// Global error handler
const sendErrorForDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode)
      .json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        err: err
      })
  }

  // Rendered website
  res.status(err.statusCode)
    .render('error', {
      title: 'Something went wrong!',
      msg: err.message
    })
}

const sendErrorForProd = (err, req, res) => {
  // Operational errors
  if (err.isOperational){
    if (req.originalUrl.startsWith('/api')){
      // API
      res.status(err.statusCode)
        .json({
          status: err.status,
          message: err.message,
        })
    }
    // Rendered website
    res.status(err.statusCode)
      .render('error', {
        title: 'Something went wrong!',
        msg: err.message
      })
  }
  // Unknown error. Don't want to leak data to the user
  else {
    // 1) Log the error
    console.error('ERROR', err)

    // 2) Send a generic message
    res.status(500)
      .json({
        status: 'Error',
        message: 'Please try again later.'
      })
  }
}

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`
  return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(e => e.message)
  const message = `Invalid input data. ${errors.join(' ')}`
  return new AppError(message, 400)
}

const handleJWTError = () => new AppError('Please login again.', 401)

const handleJWTExpireError = () => new AppError('Verification time is expired. Please login again.', 401)
const handleDuplicateFields = err => {
  const message = `Duplicate field value : '${err.keyValue.name}'`
  return new AppError(message, 400)
}
module.exports= (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'
  if (process.env.NODE_ENV === 'development'){
    sendErrorForDev(err, req, res)
  }else if (process.env.NODE_ENV === 'production'){
    let error = {...err}
    error.message = err.message
    if (err.name === 'CastError') error = handleCastErrorDB(error)
    if (err.code === 11000) error = handleDuplicateFields(error)
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error)
    if (err.name === 'JsonWebTokenError') error = handleJWTError()
    if (err.name === 'TokenExpiredError') error = handleJWTExpireError()
    sendErrorForProd(error, req, res)
  }
  next()
}