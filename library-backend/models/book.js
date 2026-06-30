const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    unique: true,
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author",
  },
  published: {
    type: Number,
    min: 0, // no negative numbers
  },
  genres: {
    type: [
      {
        type: String,
        minlength: 1,
        trim: true,
      },
    ],
    required: true,
    default: [],
  },
});

module.exports = mongoose.model("Book", schema);
