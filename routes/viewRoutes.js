const express = require('express')
const router = express.Router()
const viewController = require('./../controllers/viewsController')
const authController = require('./../controllers/authentication')


// Not protected routes
router.get('/', authController.isLoggedIn, viewController.getOverview)
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour)
router.get('/login', authController.isLoggedIn, viewController.getLoginForm)


// Protected routes
router.get('/me', authController.protect, viewController.getAccount)
router.post('/submit-user-data', authController.protect, viewController.updateUserData)



module.exports = router