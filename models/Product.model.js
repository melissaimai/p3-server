const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const productSchema = new Schema(
  {
    img: String,
    price: {
      type: Number,
      required: [true, "Price is required."],
    },
    title: {
      type: String,
      required: [true, "Title is required."],
    },
    description: {
      type: String,
      required: [true, "Description is required."],
    },
    createdBy: {
      type: Schema.Types.ObjectId, ref: 'User'
    },
    user: {
      type: Schema.Types.ObjectId, ref: 'User'
    },
    sold: {
      type: Boolean,
      default: false
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Product = model("Product", productSchema);

module.exports = Product;
