const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const Product = require('../models/Product.model')
const User = require('../models/User.model')

const { isAuthenticated } = require('./../middleware/jwt.middleware.js');

//show products list (Browse)
router.get('/products', (req, res) => {
  Product.find()
    .then(products => res.json(products))
    .catch(err => console.log(err))
})

//add a new product (Sell)
router.post('/products', isAuthenticated, (req, res, next) => {
  const { title, description, img, price } = req.body
  const createdBy = req.payload._id
  if (price === '' || title === '') {
    res.status(400).json({ message: "Fill all fields." });
    return;
  }
  async function createProduct() {
    try {
      const productCreated = await Product.create({ img, title, price, description, createdBy })
      const userUpdated = await User.findByIdAndUpdate(createdBy, { $push: { userProducts: productCreated._id } }, { new: true })
      res.json(productCreated)
    } catch (error) {
      console.log(error)
    }
  }
  createProduct()
})

//See product detail
router.get('/product/detail/:productId', isAuthenticated, (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }
  Product.findById(productId)
    .then(product => res.json(product))
    .catch(err => console.log(err))
})

// //routers for editing an activity 
// router.get('/activities/:activityID/edit', isAuthenticated, (req, res, next) => {
//   const { activityID } = req.params;
//   if (!mongoose.Types.ObjectId.isValid(activityID)) {
//     res.status(400).json({ message: 'Specified id is not valid' });
//     return;
//   };
//   Activity.findById(activityID)
//     .populate('members', '_id name image')
//     .then(foundActivity => {
//       if (foundActivity.createdBy.valueOf() !== req.payload._id) {
//         res.status(401).json({ message: "Wrong credentials" });
//         return;
//       }
//       res.json(foundActivity)
//     })
//     .catch(err => console.log(err))

// })



// // router for joining an activity;

// router.get('/activities/:activityID/join', isAuthenticated, async (req, res, next) => {
//   const { activityID } = req.params
//   const joinedBy = req.payload._id
//   if (!mongoose.Types.ObjectId.isValid(activityID)) {
//     res.status(400).json({ message: 'Specified id is not valid' });
//     return;
//   };

//   try {
//     const updatedActivity = await Activity.findByIdAndUpdate(activityID, { $push: { members: joinedBy } }, { new: true })
//       .populate('members', '_id name image')
//       .populate('sport')
//       .populate('createdBy', '_id name image')
//     const updatedUser = await User.findByIdAndUpdate(joinedBy, { $push: { joinedActivities: activityID } }, { new: true })
//     res.json(updatedActivity)
//   } catch (error) {
//     console.log(error)
//   }

// })

// // router for leaving an activity

// router.get('/activities/:activityID/leave', isAuthenticated, async (req, res, next) => {
//   const { activityID } = req.params
//   const leftBy = req.payload._id
//   if (!mongoose.Types.ObjectId.isValid(activityID)) {
//     res.status(400).json({ message: 'Specified id is not valid' });
//     return;
//   };
//   try {
//     const updatedActivity = await Activity.findByIdAndUpdate(activityID, { $pull: { members: leftBy } }, { new: true })
//       .populate('members', '_id name image')
//       .populate('sport')
//       .populate('createdBy', '_id name image')
//     const updatedUser = await User.findByIdAndUpdate(leftBy, { $pull: { joinedActivities: activityID } })
//     res.json(updatedActivity)
//   } catch (error) {
//     console.log(error)
//   }
// })



// router.put('/activities/:activityID', isAuthenticated, (req, res, next) => {
//   const { activityID } = req.params;
//   if (!mongoose.Types.ObjectId.isValid(activityID)) {
//     res.status(400).json({ message: 'Specified id is not valid' });
//     return;
//   };
//   Activity.findById(activityID)
//     .then(foundActivity => {
//       if (foundActivity.createdBy.valueOf() !== req.payload._id) {
//         res.status(401).json({ message: "Wrong credentials" });
//         return;
//       }
//       // Sport.findByIdAndUpdate(foundActivity.sport, { $pull: { activities: activityID } }, {new: true} )
//       //.then((res)=> console.log('yy', res ))
//       const { name, description, duration, activityDate, location, sport } = req.body
//       return Activity.findByIdAndUpdate(foundActivity._id, { name, description, duration, activityDate, location, sport }, { new: true })
//         .then((updatedActivity) => {
//           // Sport.findByIdAndUpdate(updatedActivity.sport, { $push: { activities: updatedActivity._id }}, { new: true })
//           // .then((res)=> console.log('xxx', res ))
//           return res.json(updatedActivity)

//         })
//     })
//     .catch(err => console.log(err))
// })


router.delete('/products/:productId', isAuthenticated, (req, res) => {
  const { productId } = req.params;
  Product.findById(productId)
    .then(() => {
      Product.findByIdAndRemove(productId)
        .then((product) => {
          return User.findByIdAndUpdate(product.createdBy, { $pull: { userProducts: productId } }, { new: true })
        })
        .then(() => res.json({ message: `Product was successfully deleted` }))
    })
    .catch(err => console.log(err))
})


module.exports = router;