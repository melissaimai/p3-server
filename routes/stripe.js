const express = require('express');
const app = express();
const Stripe = require('stripe');
const { Order } = require('../models/Order');
require("dotenv").config()
const stripe = Stripe(process.env.STRIPE_KEY)
const router = express.Router()

router.post('/create-checkout-session', async (req, res) => {
  const product = req.body.product;
  const customer = await stripe.customers.create({
    metadata: {
      userId: req.body.userId,
      product: JSON.stringify(req.body.product)
    }
  })

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

    customer: customer.id,


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

//Create Order
const createOrder = async (customer, data) => {
  const Item = JSON.parse(customer.metadata.product);
  console.log(customer)


  const newOrder = new Order({
    userId: customer.metadata.userId,
    customerId: data.customer,
    paymentIntentId: data.payment_intent,
    product: Item,
    subtotal: data.amount_subtotal / 100,
    total: data.amount_total / 100,
    shipping: data.customer_details,
    payment_status: data.payment_status,
  })

  try {
    const savedOrder = await newOrder.save();
    console.log("Processed Order:", savedOrder);
  } catch (err) {
    console.log(err);
  }
}

//Stripe Webhook
// server.js
// This is your Stripe CLI webhook secret for testing your endpoint locally.
let endpointSecret

// endpointSecret = "whsec_993c85386acc9262efccd9cbe05c66a5a37b7e9b68db8bfdaec67b4faf101ea7";

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let data;
  let eventType;

  if (endpointSecret) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    data = req.body.data.object;
    eventType = req.body.type;
  } else {
    data = req.body.data.object;
    eventType = req.body.type;
  }


  // Handle the event
  //   switch (event.type) {
  //   case 'payment_intent.succeeded':
  //     const paymentIntent = event.data.object;
  //     // Then define and call a function to handle the event payment_intent.succeeded
  //     break;
  //   // ... handle other event types
  //   default:
  //     console.log(`Unhandled event type ${event.type}`);
  // }

  if (eventType === "checkout.session.completed") {
    stripe.customers
      .retrieve(data.customer)
      .then((customer) => {
        // console.log(customer);
        // console.log("data:", data);
        createOrder(customer, data)
      })
      .catch(err => console.log(err.message));
  }


  // Return a 200 response to acknowledge receipt of the event
  res.send().end();
});


module.exports = router