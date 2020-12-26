const express = require("express");
const dotenv = require("dotenv").config();
const path = require("path");
const uuid = require("uuid").v4;
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Customer = require("./models/customers");
const app = express();
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
  })
  .then(() => {
    console.log("Database Connected");
  })
  .catch((error) => {
    console.log(error.message);
  });
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
app.use(express.json());
app.use(bodyParser.json());
const stripe = require("stripe")(stripeSecretKey);
app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Customer whole detail with product
const customerDetail = {
  name: "Shivendra",
  email: "shanuver.sv@gmail.com",
  address: {
    line1: "Shastri Nagar",
    postal_code: "226004",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
  },
  product: {
    item: "iphone",
    price: 10,
  },
};

app.get("/", function (req, res) {
  res.render("stripe", {
    key: stripePublicKey,
    product: customerDetail,
  });
});

app.post("/payment", async function (req, res) {
  try {
    const paymentId = await Customer.findOne({ email: req.body.stripeEmail });
    const idempotencyKey = uuid();
    let customer = null
    let charge = null;
    if (paymentId == null) {
      // Create New Customer
      customer = await stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: customerDetail.name,
        address: {
          city: customerDetail.address.city,
          line1: customerDetail.address.line1,
          postal_code: customerDetail.address.postal_code,
          state: customerDetail.address.state,
          country: customerDetail.address.country,
        },
      });
      // Store Customer Id with email
      await Customer.create({
          Id: customer.id,
          email: req.body.stripeEmail 
      })
    }
    // Charge the customer
    charge = await stripe.charges.create(
      {
        amount: customerDetail.product.price * 100,
        description: customerDetail.product.item,
        currency: "INR",
        customer: (paymentId == null) ? customer.id : paymentId.Id,
      },
      { idempotencyKey }
    );
    return res.send("success");
  } catch (error) {
    res.send(error.message);
  }
});

// Retrieve customer
app.get('/customer', async (req, res) => {
  const cust_Id = await Customer.findOne({email: customerDetail.email}).select("-_id -__v");
  const customer = await stripe.customers.retrieve(cust_Id.Id)
  return res.json(customer)
})
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server connected to port ${PORT}`);
});
