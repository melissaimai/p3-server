const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product.model')
const User = require('../models/User.model')
const { Order } = require("../models/Order");
const { isAuthenticated } = require('./../middleware/jwt.middleware.js');

//CREATE

// createOrder is fired by stripe webhook
// example endpoint

router.post("/orders", isAuthenticated, async (req, res) => {
  const newOrder = new Order(req.body);
  try {
    const savedOrder = await newOrder.save();
    await Product.findByIdAndUpdate(savedOrder.product[0]._id, [{ $set: { sold: { $eq: [false, "$sold"] } } }], { new: true })
    res.status(200).send(savedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

//UPDATE order
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).send(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

//DELETE order
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).send("Order has been deleted...");
  } catch (err) {
    res.status(500).send(err);
  }
});

//GET USER ORDERS
router.get("/find/:userId", isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.payload._id });
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});


//GET ALL ORDERS

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET MONTHLY INCOME

router.get("/income", isAuthenticated, async (req, res) => {
  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));

  try {
    const income = await Order.aggregate([
      { $match: { createdAt: { $gte: previousMonth } } },
      {
        $project: {
          month: { $month: "$createdAt" },
          sales: "$amount",
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$sales" },
        },
      },
    ]);
    res.status(200).send(income);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;