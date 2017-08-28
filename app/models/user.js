var mongoose = require('mongoose')
var Schema = mongoose.Schema

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')

var env = require('../../env')

var UserSchema = new mongoose.Schema(
  {
    username:{type:String , required:true , unique:true},
    password:{type:String , required:true}
  }
)

//passport local strategy for authentication
passport.use(new LocalStrategy(
  function(username, password, done) {
    process.nextTick(function() {
      User.findOne({
        'username': username,
      },
      function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false , { message: "Username or password is incorrect" });
        }
        bcrypt.compare(password, user.password, function(err, res) {
          if(err) throw err;

          if(res == false){
            return done(null , false , { message: "Username or password is incorrect" });
          }

          if(res == true){
            return done(null , user)
          }
        });
      });
    });
  }));

  var User = module.exports = mongoose.model('User' , UserSchema);

  module.exports.verifyCredentials = function(req, res, next){
    passport.authenticate('local' ,function(err, user , info){
      if(err)
      return next(err);

      if(!user)
      return res.send({message:"Error authentcating. Username or password is incorrect"})

      req.logIn(user, { session: false }, function(err){
        if(err){
          return next(err);
        }

        //generating JWT
        var tokenData = {
          username:user.username,
          id:user._id
        }

        let token = jwt.sign(tokenData , env.SECRET , {
          expiresIn:1440
        })

        req.session.accessToken = token;
        res.send({"message": user.username + " Authenticated" , token:token})
      })
    })(req,res,next)
  }

  module.exports.createUser = function(newUser , callback){
    User.findOne(
      { username: newUser.username },
      function(err,user){
        if(user){
          var message = {message: "User already exists"}
          callback(null , message);
        }
        else{
          bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(newUser.password, salt, function(err, hash) {
              if(err)
              throw err
              newUser.password = hash;
              newUser.save(callback);
            })
          })
        }
      })
    }

    module.exports.findUserByUsername = function(username , callback){
      User.findOne(
        {username: username},
        function(err , user){
          if(err)
          callback(err , null)
          else if(user){
            var message = {
              message:"User exists",
              userId: user._id
            }
            callback(null , message)
          }
          else{
            var message = {
              message:"User not found",
              userId:null
            }
            callback(null , message)
          }
        }
      )
    }
