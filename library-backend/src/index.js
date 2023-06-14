const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const express = require("express");
const cors = require("cors");
const http = require("http");

//const { startStandaloneServer } = require("@apollo/server/standalone");
const jwt = require("jsonwebtoken");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

//require("dotenv").config({ path: "../.env" });
//require("dotenv");

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");

const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");

//MONGODB_URI = `mongodb+srv://testuser:666testvitunuser@cluster0.lngrmwx.mongodb.net/?retryWrites=true&w=majority`;
const url = process.env.MONGODB_URI;
//const testpath = process.env.MONGODB_URI;
//console.log("test path", testpath);
//const url = MONGODB_URI;
console.log("connecting to MongoDB");
mongoose
  .connect(url)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB", error);
  });

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/",
  });
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null;
        if (auth && auth.startsWith("Bearer ")) {
          const decodedToken = jwt.verify(
            auth.substring(7),
            process.env.JWT_SECRET
          );
          const currentUser = await User.findById(decodedToken.id);
          console.log("currentUser: ", currentUser);
          return { currentUser };
        }
      },
    })
  );

  const PORT = 4000;

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`)
  );
};

start();

// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
// });

// startStandaloneServer(server, {
//   listen: { port: 4000 },
//   context: async ({ req, res }) => {
//     const auth = req ? req.headers.authorization : null;
//     if (auth && auth.toLowerCase().startsWith("bearer ")) {
//       const decodedToken = jwt.verify(
//         auth.substring(7),
//         process.env.JWT_SECRET
//       );
//       const currentUser = await User.findById(decodedToken.id);
//       return { currentUser };
//     }
//   },
// }).then(({ url }) => {
//   console.log(`Server ready at ${url}`);
// });
