const path = require('path')
const express = require('express')
const morgan = require('morgan')
const app = express()
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoute')
const viewRouter = require('./routes/viewRoutes')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xssClean = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')


app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// serving static files
app.use(express.static(path.join(__dirname, 'public')))

// security http headers
app.use(helmet())

// body parser
app.use(express.json({ limit: '10kb' })) // max data in body
app.use(express.urlencoded({extended: true, limit: '10kb'})) // parse data coming from a form
app.use(cookieParser()) // parse data from cookie

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use(xssClean())

// Parameter pollution
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsAverage',
    'ratingsQuantity',
    'price',
    'maxGroupSize',
    'difficulty'
  ]
}))

if (process.env.NODE_ENV === 'development'){
  app.use(morgan('tiny')) // dev, tiny
}

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next()
})

// limit request
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP. Try again in an hour.'
})

app.use('/api', limiter)

app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404)) // is error goes to global error handler
})

app.use(globalErrorHandler)

module.exports = app
