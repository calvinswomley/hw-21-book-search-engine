const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        //get get a single user by either their id and poulate savedBooks and authors
        me: async (parent, args, context) => {
          if (context.user) {
            const userData = await User.findOne({ _id: context.user._id }).select('-__v -password');
            return userData;
          }
          throw new AuthenticationError('You need to be logged in!');
        },
    },
    Mutation: {
        // create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
        createUser: async (parent, args) => {
          const user = await User.create(args);
          const token = signToken(user);
          return { token, user };
        },
      
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
        
        // save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates)
        // user comes from `req.user` created in the auth middleware function
        saveBook: async (parent, { bookId, authors, description, title, image, link }, context) => {
            if (context.user) {        
                const bookUpdate = await User.findByIdAndUpdate(
                  { _id: context.user._id },
                  { $push: { savedBooks: bookId, authors, description, title, image, link }},
                  { new: true }
                );
        
                return bookUpdate;
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
