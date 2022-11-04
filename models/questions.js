const mongoose = require('mongoose')
const questionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    tag: {
        type: String,
        required: false
    }
})

module.exports= mongoose.model('MemwaQuestion', questionSchema, 'questions')