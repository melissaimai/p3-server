const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product.model')
const User = require('../models/User.model')
const fileUploader = require("../config/cloudinary.config");
const { isAuthenticated } = require('./../middleware/jwt.middleware.js');

//show products list (Browse)
router.get('/products', (req, res) => {
  Product.find()
    .populate('createdBy', '_id name img')
    .then(products =>
      res.json(products))
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

// POST "/api/upload" => Route that receives the image, sends it to Cloudinary via the fileUploader and returns the image URL
router.post("/upload", fileUploader.single("img"), (req, res, next) => {
  // console.log("file is: ", req.file)

  if (!req.file) {
    next(new Error("No file uploaded!"));
    return;
  }

  // Get the URL of the uploaded file and send it as a response.
  // 'fileUrl' can be any name, just make sure you remember to use the same when accessing it on the frontend

  res.json({ fileUrl: req.file.path });
});

//See product detail
router.get('/product/detail/:productId', isAuthenticated, (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }
  Product.findById(productId)
    .populate('createdBy', '_id name img')
    .then(product => res.json(product))
    .catch(err => console.log(err))
})

//routers for editing a product
router.get('/product/:productId/edit', isAuthenticated, (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  };
  Product.findById(productId)
    .then(foundProduct => {
      if (foundProduct.createdBy.valueOf() !== req.payload._id) {
        res.status(401).json({ message: "Wrong credentials" });
        return;
      }
      res.json(foundProduct)
    })
    .catch(err => console.log(err))
})

//updating the product
router.put('/product/:productId', isAuthenticated, (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  };
  Product.findById(productId)
    .then(foundProduct => {
      if (foundProduct.createdBy.valueOf() !== req.payload._id) {
        res.status(401).json({ message: "Wrong credentials" });
        return;
      }
      const { img, title, price, description } = req.body
      return Product.findByIdAndUpdate(foundProduct._id, { img, title, price, description }, { new: true })
        .then((updatedProduct) => {
          return res.json(updatedProduct)
        })
    })
    .catch(err => console.log(err))
})


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