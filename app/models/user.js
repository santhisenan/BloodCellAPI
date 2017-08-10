var mongoose = require('mongoose')
var Schema = mongoose.Schema
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs')

var UserSchema = new mongoose.Schema(
  {
    username:String,
    password:String
  }
)

var User = module.exports = mongoose.model('User' , UserSchema);

module.exports.createUser = function(newUser , callback){
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
      if(err) throw err;
      newUser.password = hash;
      newUser.save(callback);
    });
  });

}



passport.use(new LocalStrategy(function(username, password, done) {
  process.nextTick(function() {
    User.findOne({
      'username': username,
    }, function(err, user) {

      if (err) {
        return done(err);
      }


      if (!user) {
        return done(null, false);
      }
      console.log("User exists");

      bcrypt.compare(password, user.password, function(err, res) {
        if(err) throw err;
        if(res == false){
          // console.log(res);
          return done(null , false);
        }

        if(res === true){
          return done(user , true)
        }
      });

      // return done(null, user);
    });
  });
}));
