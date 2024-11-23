const express = require("express");
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", function (req, res) {
  res.render("index");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/profile", isLoggedIn, async function (req, res) {
  const { email } = req.user;
  let user = await userModel.findOne({ email }).populate("posts");
  res.render("profile", { user } );
});
app.get("/like/:id", isLoggedIn, async function (req, res) {
  
  let post = await postModel.findOne({_id: req.params.id }).populate("user");

  if(post.likes.indexOf(req.user.id) === -1){
    post.likes.push(req.user.id);
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.id), 1);
  }
  await post.save();
  res.redirect("/profile")
});
app.get("/edit/:id", isLoggedIn, async function (req, res) {
  
  let post = await postModel.findOne({_id: req.params.id }).populate("user");
  res.render("edit" , {post})
});
app.post("/update/:id", isLoggedIn, async function (req, res) {
  await postModel.findOneAndUpdate({_id: req.params.id} , {content : req.body.content}).populate("user")
  res.redirect("/profile")
});
app.post("/post", isLoggedIn, async function (req, res) {
  const {email} = req.user
  let user = await userModel.findOne({ email });
  let { content } = req.body;
  let post = await postModel.create({user:user._id , content})

  user.posts.push(post._id)
  user.save()
  
  res.redirect("/profile");
});

app.post("/login", async (req, res) => {
  const { password, email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) res.sendStatus("something went wrong");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email, id: user._id }, "shhhh");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    }
  });
});
app.get("/logout", async (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.post("/register", async (req, res) => {
  const { username, name, password, age, email } = req.body;

  const user = await userModel.findOne({ email });
  if (user) {
    return res.status(500).send("Email already exists");
  }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const createduser = await userModel.create({
        username,
        name,
        password: hash,
        age,
        email,
      });
      let token = jwt.sign({ email, id: createduser._id }, "shhhh");
      res.cookie("token", token);
      res.redirect("/login");
    });
  });
});
function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    res.redirect("/login");
  } else {
    const data = jwt.verify(req.cookies.token, "shhhh");
    req.user = data;
    next();
  }
}
app.listen(3000);
