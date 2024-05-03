const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://CrownDB:crown@crown.zemug6e.mongodb.net/miniproject?retryWrites=true&w=majority&appName=Crown"
);

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});

module.exports = mongoose.model("user", userSchema);
