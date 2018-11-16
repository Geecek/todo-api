const mongoose = require('mongoose')

const List = mongoose.model('List', {
    _owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    _parent: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    }
})

module.exports = {List}