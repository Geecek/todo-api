const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

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
    },
    removeToken (token) {
        const user = this
        return user.update({
            $pull: {
                tokens: {
                    token
                }
            }
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
    },
    findByCredentials (email, password) {
        const User = this

        return User.findOne({email}).then((user) => {
            if (!user) {
                return Promise.reject()
            }
            return new Promise((resolve, reject) => {
                bcrypt.compare(password, user.password, (err, res) => {
                    if (res) {
                        resolve(user)
                    }
                    reject()
                })
            })
        })
    }
}

UserSchema.pre('save', function (next) {
    const user = this

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash
                next()
            })
        })
    } else {
        next()
    }
})

const User = mongoose.model('User', UserSchema)

module.exports = {User}