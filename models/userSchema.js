var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({ 
    name: {type:String, required:true},
    time: Number,
    course: String
});

//Export model
module.exports = mongoose.model('user', userSchema)