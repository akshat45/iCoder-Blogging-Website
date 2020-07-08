//jshint esversion:6
require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const homeStartingContent = "Welcome to iCoder, which is the best platform to learn about new Technologies,Developments and new trends.If you want to increase your blogging skills and want other's to gain knowledge that you have ,then start composing new blogs";
const aboutContent = "iCoder was founded in 2020 by akshat gupta. It was created to spread knowledge about new Technologies,Developments and trends to everyone. "
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
 
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-akshat:Akshar@cluster0-cdlt8.mongodb.net/blogsDB", {useNewUrlParser: true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
  });

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://infinite-lowlands-65090.herokuapp.com/auth/google/home",
  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author : String
});

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res){
 res.render("start");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);
app.get('/auth/google/home', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });
app.get("/login",function(req,res){
  res.render("login");
})
app.get("/register",function(req,res){
  res.render("register");
})
app.get("/home", function(req, res){
  if(req.isAuthenticated()){
    Post.find({}, function(err, posts){
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts
        });
    });
} else{
    res.redirect("/login");
    }
});
app.get("/about", function(req, res){
  if(req.isAuthenticated()){
    res.render("about", {aboutContent: aboutContent});
} else{
    res.redirect("/login");
}
  
});

app.get("/compose",function(req,res){
  if(req.isAuthenticated()){
      res.render("compose");
  } else{
      res.redirect("/login");
  }
});
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});
app.post("/register",function(req,res){
  User.register({username : req.body.username},req.body.password , function(err,user){
      if(err){
          console.log(err);
          res.redirect("/register");
      }else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/home");
          })
      }
  })
 
})

app.post("/login",function(req,res){
  const user = new User({
      username : req.body.username,
      password : req.body.password
  });

  req.login(user , function(err){
      if(err){
          console.log(err);
      }
      else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/home");
          })
      }
  })
})

app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    author : req.body.author
  });


  post.save(function(err){
    if (!err){
        res.redirect("/home");
    }
  });
});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;
if(req.isAuthenticated()){
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content,
      author : post.author
    });
  });
} else{
  res.redirect("/login");
}
  

});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});
