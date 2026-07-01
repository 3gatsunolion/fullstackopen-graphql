const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");

const Author = require("../models/author");
const Book = require("../models/book");
const User = require("../models/user");

const MONGODB_URI = process.env.MONGODB_URI;
console.log(MONGODB_URI);
const initialAuthors = [
  { name: "Robert Martin", born: 1952 },
  { name: "Martin Fowler", born: 1963 },
  { name: "Fyodor Dostoevsky", born: 1821 },
];

const initialBooks = [
  {
    title: "Clean Code",
    published: 2008,
    authorName: "Robert Martin",
    genres: ["refactoring"],
  },
  {
    title: "Agile software development",
    published: 2002,
    authorName: "Robert Martin",
    genres: ["agile", "patterns", "design"],
  },
  {
    title: "Refactoring, edition 2",
    published: 2018,
    authorName: "Martin Fowler",
    genres: ["refactoring"],
  },
  {
    title: "Refactoring to patterns",
    published: 2008,
    authorName: "Joshua Kerievsky",
    genres: ["refactoring", "patterns"],
  },
  {
    title: "Crime and punishment",
    published: 1866,
    authorName: "Fyodor Dostoevsky",
    genres: ["classic", "crime"],
  },
];

async function initialize() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Author.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});
    console.log("Cleared existing collections");

    // Create authors
    const authorDocs = {};

    for (const authorData of initialAuthors) {
      const author = await Author.create(authorData);
      authorDocs[author.name] = author;
    }

    // Create books
    for (const bookData of initialBooks) {
      let author = authorDocs[bookData.authorName];

      // Create missing author if necessary
      if (!author) {
        author = await Author.create({
          name: bookData.authorName,
        });
        authorDocs[bookData.authorName] = author;
      }

      await Book.create({
        title: bookData.title,
        published: bookData.published,
        author: author._id,
        genres: bookData.genres,
      });

      // // Increment author's book count
      // await Author.findByIdAndUpdate(author._id, {
      //   $inc: { bookCount: 1 },
      // });
    }

    // Create default user
    await User.create({
      username: "testuser",
      favoriteGenre: "refactoring",
    });

    console.log("Database initialized successfully!");
  } catch (err) {
    console.error("Initialization failed:");
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  }
}

initialize();
