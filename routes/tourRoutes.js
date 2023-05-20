const express = require('express');
const router = express.Router({mergeParams: true})
const tourController = require('./../controllers/tourController')
const authController = require('./../controllers/authentication')
const reviewRouter = require('./reviewRoute')

router.use('/:tourId/reviews', reviewRouter)

router.route('/tour-stats')
  .get(tourController.getTourStats)

router.route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guides'),
    tourController.getMonthlyPlan
  )

router.route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances)

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin)

router.route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  )

router.route('/:id')
  .get(tourController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )

module.exports = router