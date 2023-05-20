const express = require('express');
const router = express.Router()
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authentication')

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.post('/forgot-password', authController.forgotPassword)
router.patch('/reset-password/:token', authController.resetPassword)

router.use(authController.protect)

router.patch('/update-me',userController.updateMe)
router.delete('/delete-me',userController.deleteMe)

router.get('/me', userController.getMe, userController.getUser)
router.patch('/updateMyPassword', authController.updatePassword)

router.use(authController.restrictTo('admin'))

router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser)

router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)

module.exports = router