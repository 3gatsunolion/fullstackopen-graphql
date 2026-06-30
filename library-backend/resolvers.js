const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");
const { formatMongooseError } = require("./utils/formatMongooseError");
const Author = require("./models/author");
const Book = require("./models/book");
const User = require("./models/user");

// Because we did not define all resolvers for the fields of the type Author and Book,
// Apollo has defined default resolvers for them
const resolvers = {
  Book: {
    author: async (root) => Author.findById(root.author),
  },
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (_, args) => {
      const filter = {};

      if (args.author) {
        filter.author = args.author;
      }

      if (args.genre) {
        filter.genres = args.genre;
      }

      return Book.find(filter);
    },
    allAuthors: async () => Author.find({}),
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    // In Mongo, the identifying field of an object is called _id and we previously had to parse the name of the field to id ourselves.
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
          author = new Author({ name: args.author });
        }
        author.bookCount += 1;

        const book = new Book({
          title: args.title,
          published: args.published,
          genres: args.genres,
          author: author._id,
        });
        await book.save();
        await author.save();
        return book;
      } catch (error) {
        throw formatMongooseError(error, args);
      }
    },
    // Resolver functions now return a promise, when they previously returned normal objects.
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
};

module.exports = resolvers;
