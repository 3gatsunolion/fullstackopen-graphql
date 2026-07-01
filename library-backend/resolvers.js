const { GraphQLError } = require("graphql");
const { PubSub } = require("graphql-subscriptions");
const graphqlFields = require("graphql-fields");
const jwt = require("jsonwebtoken");
const { formatMongooseError } = require("./utils/formatMongooseError");
const mongoose = require("mongoose");
const Author = require("./models/author");
const Book = require("./models/book");
const User = require("./models/user");

const pubsub = new PubSub();

// Because we did not define all resolvers for the fields of the type Author and Book,
// Apollo has defined default resolvers for them
const resolvers = {
  // ------n + 1 Problem
  // -> If there are 100 authors and you call allAuthors():
  // bookCount() runs 100 times (once per author). Hence n + 1 queries, which is bad the bigger n is
  // Author: {
  //   bookCount: (author) => Book.countDocuments({ author: author._id }),
  // },
  // Book: {
  //   author: async (root) => Author.findById(root.author),
  // },
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (_, args, context, info) => {
      const filter = {};

      if (args.author) {
        filter.author = args.author;
      }

      if (args.genre) {
        filter.genres = args.genre;
      }

      const fields = graphqlFields(info);

      const query = Book.find(filter);

      // If we modify allBooks to do a join query because it sometimes causes an n+1 problem,
      // it becomes heavier when we don't need the information on related authors, so only
      // populate/join if user requests author info
      if (fields.author) {
        return query.populate("author");
      }

      return query;
    },
    allAuthors: async () => {
      return Author.aggregate([
        {
          $lookup: {
            from: "books",
            localField: "_id",
            foreignField: "author",
            as: "books",
          },
        },
        {
          $addFields: {
            bookCount: { $size: "$books" },
            id: "$_id",
          },
        },
        {
          $project: {
            _id: 0,
            books: 0, // remove this temporarily created field
          },
        },
      ]);
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    // ------In Mongo, the identifying field of an object is called _id and we previously had to parse the name of the field to id ourselves.
    // Now GraphQL can do this automatically.
    // For example, on frontend, we just query:
    // query {
    //   allBook {
    //     id
    //     title
    //     author
    //   }
    // }
    // and graphql will return id, and we no longer need to write code that explicitly copies _id into id.

    // ------If application is read-heavy, it might be better to keep a bookCount field which we update if a book is added
    // addBook: async (_, args, context) => {
    //   const currentUser = context.currentUser;

    //   if (!currentUser) {
    //     throw new GraphQLError("not authenticated", {
    //       extensions: {
    //         code: "UNAUTHENTICATED",
    //       },
    //     });
    //   }

    //   const session = await mongoose.startSession();

    //   try {
    //     let book;

    //     // Use a transaction: all operations succeed together or none are applied.
    //     // Atomicity: ensure both the book creation and author update either commit together or are rolled back on error.
    //     // Important in this case since we're updating bookCount, so we want them to be in sync
    //     await session.withTransaction(async () => {
    //       let author = await Author.findOne({ name: args.author }).session(
    //         session,
    //       );

    //       if (!author) {
    //         author = await new Author({
    //           name: args.author,
    //         }).save({ session });
    //       }

    //       await Author.updateOne(
    //         { _id: author._id },
    //         { $inc: { bookCount: 1 } },
    //         { session },
    //       );

    //       book = await new Book({
    //         title: args.title,
    //         published: args.published,
    //         genres: args.genres,
    //         author: author._id,
    //       }).save({ session });

    //       await book.populate("author");
    //     });

    //     return book;
    //   } catch (error) {
    //     throw formatMongooseError(error, args);
    //   } finally {
    //     await session.endSession();
    //   }
    // },

    addBook: async (_, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
      }

      try {
        let author = await Author.findOne({ name: args.author });
        if (!author) {
          author = await Author.create({ name: args.author });
        }

        const book = new Book({
          title: args.title,
          published: args.published,
          genres: args.genres,
          author: author._id,
        });

        await book.save();
        await book.populate("author");
        pubsub.publish("BOOK_ADDED", { bookAdded: book });
        return book;
      } catch (error) {
        throw formatMongooseError(error, args);
      }
    },

    // ------Resolver functions now return a promise, when they previously returned normal objects.
    // When a resolver returns a promise, Apollo server sends back the value which the promise resolves to.
    // For example:
    // allPersons: async (root, args) => {
    //   return Person.find({})
    // }
    // is equivalent to (for Apollo server):
    // allPersons: async (root, args) => {
    //   const result = await Person.find({})
    //   return result
    // }
    editAuthor: async (_, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
      }

      const author = await Author.findOne({ name: args.name });

      if (!author) {
        return null;
      }

      try {
        author.born = args.setBornTo;
        return await author.save();
      } catch (error) {
        throw formatMongooseError(error, args);
      }
    },
    createUser: async (root, args) => {
      const user = new User({ ...args });

      return user.save().catch((error) => {
        throw formatMongooseError(error, args);
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "secret") {
        throw new GraphQLError("wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
    },
    _resetDatabase: async () => {
      if (process.env.NODE_ENV !== "test") {
        throw new GraphQLError("_resetDatabase is only available in test mode");
      }
      await Author.deleteMany({});
      await Book.deleteMany({});
      await User.deleteMany({});
      return true;
    },
  },
  Subscription: {
    bookAdded: {
      // clients are saved to an "iterator object" called BOOK_ADDED
      subscribe: () => pubsub.asyncIterableIterator("BOOK_ADDED"),
    },
  },
};

module.exports = resolvers;
