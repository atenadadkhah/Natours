const mongoose = require('mongoose')
const slugify = require('slugify')

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A tour name must have lass than 40 characters.'],
    minlength: [10,'A tour name must have more than 10 characters.'],
    // validate: [validator.isAlpha, 'Tour must only contain letters.']
  },
  duration: {
    type: Number,
    required: [true, "A tour must have a duration"]
  },
  maxGroupSize: {
    type: Number,
    required: [true, "A tour must have a group size"]
  },
  difficulty: {
    type: String,
    required: [true, "A tour must have a difficulty"],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either easy, medium or difficult.'
    },
    lowercase: true
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    max: [5, 'A rating must be between 1 and 5'],
    min: [1, 'A rating must be between 1 and 5'],
    set: val => Math.round(val * 10) / 10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: {
    type: Number,
    default: 0,
    validate: {
      validator: function (value) {
        // this only points to current doc on NEW document creation
        return this.price > value;
      },
      message: 'Discount price ({VALUE}) must be less than the real price.'
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, "A tour must have a summary"]
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, "A tour must have a cover image"],
    trim: true
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  slug: {
    type: String,
    unique: true
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: 'Point'
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    },
  ],
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ],
},
  {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
  })

tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ startLocation: '2dsphere' })

tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7
})

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
})

// DOC middleware: Before the .save() and .create()
tourSchema.pre('save', function (next){
  // this ==> currently processed document
  this.slug = slugify(this.name, {lower: true})
  next()
})


// Query middleware
tourSchema.pre(/^find/, function (next) {
  this.find({secretTour: {$ne: true}})
  this.start = Date.now()
  next()
})

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query executed in ${Date.now() - this.start} milliseconds!`);
  next()
})

tourSchema.pre(/^find/, function (next){
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  })
  next()
})

// Aggregation middleware
// tourSchema.pre('aggregate', function (next){
//     this.pipeline().unshift({
//     $match: {secretTour: {$ne: true}}
//   })
//   next()
// })

const Tour = mongoose.model('Tour', tourSchema)
module.exports = Tour