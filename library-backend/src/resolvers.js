const { GraphQLError } = require("graphql");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();
const jwt = require("jsonwebtoken");
const Author = require("./models/author");
const User = require("./models/user");
const Book = require("./models/book");

const resolvers = {
  Query: {
    authorCount: async () => {
      const authorCount = await Author.collection.countDocuments();
      return authorCount;
    },
    bookCount: async () => {
      const bookCount = await Book.collection.countDocuments();
      return bookCount;
    },
    allBooks: async (root, args, context) => {
      if (args.genre && args.author) {
        const author = await Author.findOne({ name: args.author });
        return Book.find({ author: author, genres: args.genre }).populate(
          "author"
        );
      } else if (args.genre) {
        return Book.find({ genres: args.genre }).populate("author");
      } else if (args.author) {
        const author = await Author.findOne({ name: args.author });
        if (author) {
          const foundBooks = await Book.find({
            author: author,
          }).populate("author");
          return foundBooks;
        } else {
          console.log("author not found");
        }
      } else {
        return Book.find({}).populate("author");
      }
    },
    allAuthors: async () => {
      const foundAuthors = await Author.find({}).populate("books");
      console.log("author count called");
      return foundAuthors;
    },
    me: (root, args, context) => {
      console.log("query me: ", context.currentUser);
      return context.currentUser;
    },
  },
  Author: {
    bookCount: (root) => {
      return root.books.length;
    },
  },

  // Author: {
  //   bookCount: async (root) => {
  //     console.log("Author:bookCount called");
  //     const booksByAuthor = await Book.find({ author: root });
  //     return booksByAuthor.length;
  //   },
  // },

  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;
      console.log("context.currentUSer", context.currentUser);

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const searchBook = await Book.findOne({ title: args.title });
      if (searchBook) {
        throw new GraphQLError("Title must be unique", {
          extensions: { code: "BAD_USER_INPUT", invalidArgs: args.name },
        });
      }
      const searchAuthor = await Author.findOne({ name: args.name });
      if (!searchAuthor) {
        const newAuthor = new Author({ name: args.name });
        try {
          await newAuthor.save();
        } catch (error) {
          console.log("error in author save");
          throw new GraphQLError("saving author failed", {
            extension: {
              code: "BAD_USER_INPUT",
              invalidArgs: args.name,
              error,
            },
          });
        }
      }
      const author = await Author.findOne({ name: args.name });
      const newBook = new Book({ ...args });
      newBook.author = author;

      author.books = author.books.concat(newBook._id);
      try {
        await author.updateOne({ $push: { books: newBook } });
      } catch (error) {
        console.log("error in saving books for author", args.name);
        throw new GraphQLError("saving author failed", {
          extension: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.title,
            error,
          },
        });
      }

      try {
        await newBook.save();
      } catch (error) {
        console.log("error in saving newBook", args.title);
        throw new GraphQLError("saving book failed", {
          extension: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.title,
            error,
          },
        });
      }
      pubsub.publish("BOOK_ADDED", { bookAdded: newBook });
      return newBook;
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;
      console.log("context.currentUSer", context.currentUser);
      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const author = await Author.findOne({ name: args.name });
      if (!author) {
        console.log("author not found");
        return null;
      }
      author.born = args.setBornTo;
      try {
        await author.save();
      } catch (error) {
        console.log("error saving author after update");
        throw new GraphQLError("updating author failed", {
          extension: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.setBornTo,
            error,
          },
        });
      }
      return author;
    },
    createUser: async (root, args) => {
      console.log(args);
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });
      console.log("created user", user);

      return user.save().catch((error) => {
        throw new GraphQLError("Creating the user failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
            error,
          },
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });
      console.log(user);

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
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator("BOOK_ADDED"),
    },
  },
};

module.exports = resolvers;
