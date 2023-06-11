const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
//const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");

console.log(require("dotenv").config());
require("dotenv").config({ path: "../.env" });
console.log(require("dotenv").config());

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");

const url = process.env.MONGODB_URI;
console.log("connecting to MongoDB");
mongoose
  .connect(url)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB", error);
  });

const typeDefs = `
  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: Author
    id: ID!
    genres: [String!]!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }
 
  type Query {
    authorCount: Int!
    bookCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      name: String!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`;

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
        return Book.find({ author: author, genres: args.genre });
      } else if (args.genre) {
        return Book.find({ genres: args.genre });
      } else if (args.author) {
        const author = await Author.findOne({ name: args.author });
        if (author) {
          const foundBooks = await Book.find({
            author: author,
          });
          return foundBooks;
        } else {
          console.log("author not found");
        }
      } else {
        return Book.find({});
      }
    },
    allAuthors: async () => {
      const foundAuthors = await Author.find({});
      return foundAuthors;
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Author: {
    bookCount: async (root) => {
      const booksByAuthor = await Book.find({ author: root });
      return booksByAuthor.length;
    },
  },

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
      const user = new User({ username: args.username });

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
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null;
    //console.log("auth", auth);
    //console.log("req", req.headers);
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      //console.log("auth && auth.startsWith ");
      const decodedToken = jwt.verify(
        auth.substring(7),
        process.env.JWT_SECRET
      );
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
