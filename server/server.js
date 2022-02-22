const express = require('express');
//NEW Import the ApolloServer class
const { ApolloServer } = require('apollo-server-express');
const path = require('path');
//const routes = require('./routes');

// Import the two parts of a GraphQL schema
const { typeDefs, resolvers } = require('./schemas');
const db = require('./config/connection');
const { authMiddleware } = require('./utils/auth');
//NEW

const PORT = process.env.PORT || 3001;
const app = express();

//NEW Create a new instance of an Apollo server with the GraphQL schema
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});
// Update Express.js to use Apollo server features
server.applyMiddleware({ app });
//NEW

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

//app.use(routes);
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

//NEW
db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
});
//NEW

//REMOVE EXISTING?
//db.once('open', () => {
// app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
//});
