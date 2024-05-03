const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, function (err, bytes) {
      const fn = bytes.toString("hex") + path.extname(file.originalname);
      cb(null, fn);
    });
  },
});

const upload = multer({ storage: storage });

app.get("/test", isLoggedIn, (req, res) => {
  res.render("test");
});

app.post("/upload", upload.single("images"), (req, res) => {
  console.log(req.file);
  res.redirect("/test");
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("profile", { user });
});

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;

  let post = await postModel.create({
    user: user._id,
    content,
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.post("/register", async (req, res) => {
  let { name, username, password, age, email } = req.body;

  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        name,
        username,
        password: hash,
        age,
        email,
      });

      var token = jwt.sign({ email, userid: user._id }, "joker98327");
      res.cookie("token", token);
      res.send("Registered");
    });
  });
});

app.post("/login", async (req, res) => {
  let { password, email } = req.body;

  let user = await userModel.findOne({ email });
  if (!user)
    return res.status(500).send("No such user exists pls create an account");

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      var token = jwt.sign({ email, userid: user._id }, "joker98327");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.status(500).send("Wrong Password");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) res.redirect("/login");
  // if (req.cookies.token === "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "joker98327");
    req.user = data;
    next();
  }
}

app.listen(3000, function () {
  console.log("Server is running on port 3000");
});
