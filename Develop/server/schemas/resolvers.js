const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        //get get a single user by either their id and poulate savedBooks and authors
        me: async () => {
            return await User.find({}).populate('savedBooks');
        }
    },
    Mutation: {
        // login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
        // {body} is destructured req.body
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
      
            if (!user) {
              throw new AuthenticationError('No user found with this email address');
            }
      
            const correctPw = await user.isCorrectPassword(password);
      
            if (!correctPw) {
              throw new AuthenticationError('Incorrect credentials');
            }
      
            const token = signToken(user);
      
            return { token, user };
          },
        // create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
          },
        // save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates)
        // user comes from `req.user` created in the auth middleware function
        saveBook: async (parent, { bookId, authors, description, title, image, link }, context) => {
            if (context.user) {
                const book = await Book.create({
                  bookId,
                  authors,
                  description,
                  title,
                  image,
                  link
                });
        
                await User.findOneAndUpdate(
                  { _id: context.user._id },
                  { $addToSet: { savedBooks: Book } }
                );
        
                return book;
              }
              throw new AuthenticationError('You need to be logged in!');
            },
        // remove a book from `savedBooks`
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
              const book = await Book.findOneAndDelete({
                _id: bookId
              });
      
              await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: Book._id } }
              );
      
              return book;
            }
            throw new AuthenticationError('You need to be logged in!');
          },
    },
};

module.exports = resolvers;
