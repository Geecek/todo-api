const mongoose = require('mongoose')

const Board = mongoose.model('Board', {
    _owner: {
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

module.exports = {Board}