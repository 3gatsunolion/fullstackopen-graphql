const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 4,
    unique: true,
    trim: true,
  },
  born: {
    type: Number,
    min: 0, // no negative numbers
  },
  // bookCount: {
  //   type: Number,
  //   min: 0,
  //   default: 0,
  // },
});

module.exports = mongoose.model("Author", schema);
