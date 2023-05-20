const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.']
  },
  photo:String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: 8,
    maxlength: 256,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      validator: function (passwordConfirm){
        return this.password === passwordConfirm
      },
      message: 'Password confirm should be the same as your password.'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
})

const encryptUserPassword = userSchema.pre('save', async function (next){
  if (this.isModified('password')){
    this.password = await bcrypt.hash(this.password, 12)
    this.passwordConfirm = undefined
  }
  next()
})

userSchema.pre('save', function (next){
  if (!this.isModified('password') || this.isNew) return next()

  this.passwordChangedAt = Date.now() - 1000 // 1s
  next()
})

userSchema.pre(/^find/, function (next) {
  this.find({ active: {$ne: false} })
  next()
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword){
  return await bcrypt.compare(candidatePassword, userPassword)
}
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimestamp
  }

  // False means not changed
  return false
}
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000

  return resetToken
}
const User = mongoose.model('User', userSchema)
module.exports = User