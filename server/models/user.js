const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
    email: {
        required: true,
        type: String,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        required: true,
        type: String,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
})

UserSchema.methods = {
    generateAuthToken () {
        const user = this
        const access = 'auth'
        const token = jwt.sign({
            _id: user._id.toHexString(),
            access
        }, '123123').toString()

        user.tokens = user.tokens.concat([{
            access,
            token
        }])

        return user.save().then(() => {
            return token
        })
    }
}

UserSchema.statics = {
    findByToken (token) {
        const User = this
        let decoded

        try {
            decoded = jwt.verify(token, '123123')
        } catch (error) {
            return Promise.reject()
        }

        return User.findOne({
            _id: decoded._id,
            'tokens.token': token,
            'tokens.access': 'auth'
        })
    }
}

const User = mongoose.model('User', UserSchema)

module.exports = {User}