const express = require('express');
const app = express();
const Stripe = require('stripe')
require("dotenv").config()
const stripe = Stripe(process.env.STRIPE_KEY)
const router = express.Router()

router.post('/create-checkout-session', async (req, res) => {
  const product = req.body.product;
  console.log(product)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: ["DE", "BR", "AU"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 195,
            currency: "eur",
          },
          display_name: "Deutsche Post",
          // Delivers between 5-7 business days
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 5,
            },
            maximum: {
              unit: "business_day",
              value: 7,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 500,
            currency: "eur",
          },
          display_name: "Hermes",
          // Delivers in exactly 1 business day
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 2,
            },
          },
        },
      },
    ],

    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.title,
            images: [product.img],
            description: `Sold by: ${product.createdBy.name}`
          },
          unit_amount: product.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/checkout-success`,
    cancel_url: `${process.env.CLIENT_URL}/`,

  });

  res.send({ url: session.url });
});

module.exports = router