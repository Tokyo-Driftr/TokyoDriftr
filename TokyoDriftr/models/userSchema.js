var mongoose = require('mongoose');

var Schema = mongoose.Schema;

//userSchema for inserting into mongoDB
var userSchema = new Schema({ 
    name: {type:String, required:true},
    time: Number,
    course: String
});

//Export model
module.exports = mongoose.model('user', userSchema)