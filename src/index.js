const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");

console.log(require("dotenv").config());
require("dotenv").config({ path: "../.env" });
console.log(require("dotenv").config());

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const Book = require("./models/book");
const Author = require("./models/author");

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

  type Query {
    authorCount: Int!
    bookCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
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
    allBooks: async (root, args) => {
      console.log("root", root);
      console.log("args", args);
      console.log("args.author", args.author);
      console.log("args.genre ", args.genre);
      if (args.genre && args.author) {
        return Book.find({ author: args.author, genres: [args.genre] });
      } else if (args.genre) {
        return Book.find({ genres: args.genre });
      } else if (args.author) {
        console.log(
          "searching from args.author with args",
          args,
          "args.author",
          args.author,
          "typeof args.author",
          typeof args.author
        );

        const author = await Author.findOne({ name: args.author });
        if (author) {
          console.log("author found", author.name, author.id);
          const foundBooks = await Book.find({
            author: author.id,
          });
          console.log("type of foundBooks", typeof foundBooks);
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
  },
  Author: {
    bookCount: async (root) => {
      const booksByAuthor = await Book.find({ author: args.author });
      return booksByAuthor.length;
    },
  },
  Mutation: {
    addBook: async (root, args) => {
      const searchBook = await Book.findOne({ title: args.title });
      if (searchBook) {
        console.log("validation errror in book name");
        throw new GraphQLError("Title must be unique", {
          extensions: { code: "BAD_USER_INPUT", invalidArgs: args.name },
        });
      }

      console.log("addbook mutation, args: ", args);

      console.log("args.name", args.name);

      const newBook = new Book({ ...args });

      const searchAuthor = await Author.findOne({ name: args.name });

      if (!searchAuthor) {
        console.log("author not found");
        try {
          const newAuthor = new Author({ name: args.name });
          console.log("newAuthor: ", newAuthor);
          await newAuthor.save();
        } catch (error) {
          console.log("saving new author not succesful error", error);
        }
      } else {
        console.log("author found");
      }

      const author = await Author.findOne(args.author);
      console.log("author ", typeof author);

      newBook.author = author;
      console.log("newBook ", newBook);
      try {
        newBook.save();
        console.log("saving newBook succesfull");
      } catch (error) {
        console.log("saving newBook not succesfull, error: ", error);
      }
      return newBook;
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name });
      if (!author) {
        console.log("author not found");
        return null;
      }
      console.log("author found");
      author.born = args.setBornTo;
      try {
        author.save();
      } catch (error) {
        console.log("error saving author after update", error);
      }
      return author;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
