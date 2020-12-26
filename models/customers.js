const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({

    Id: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        select: false
    }
})

module.exports = mongoose.model("Customer", customerSchema);