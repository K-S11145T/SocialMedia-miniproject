const mongoose = require("mongoose");

const dotenv = require("dotenv")

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("connected");
});

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  password: String,
  email: String,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);
