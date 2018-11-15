require('./config/config')

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const _ = require('lodash')

const {mongoose} = require('./db/mongoose')
const {ObjectID} = require('mongodb')
const {Todo} = require('./models/todo')
const {Board} = require('./models/board')
const {User} = require('./models/user')
const {authenticate} = require('./middleware/authenticate')

const app = express()
const port = process.env.PORT

app.use(bodyParser.json())
app.use(cors())

app.post('/todos', authenticate, (req, res) => {
    const todo = new Todo({
        _owner: req.user._id,
        text: req.body.text
    })

    todo.save().then((doc) => {
        res.send(doc)
    }, (err) => {
        res.status(400).send(err)
    })
})

app.get('/todos', authenticate, (req, res) => {
    Todo.find({
        _owner: req.user._id
    }).then((todos) => {
        res.send({
            todos
        })
    }, (err) => {
        res.send({
            err
        })
    })
})

app.get('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
        return res
            .status(404)
            .send()
    }

    Todo.findOne({
        _id: id,
        _owner: req.user._id
    }).then((todo) => {
        if (todo) {
            return res
                .send({
                    todo
                })
                .status(200)
        }
        res
            .status(404)
            .send()
    }).catch((err) => {
        res
            .status(400)
            .send()
    })
})

app.delete('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
        return res
            .status(404)
            .send()
    }

    Todo.findOneAndDelete({
        _id: id,
        _owner: req.user._id
    }).then((todo) => {
        if (!todo) {
            return res
                .status(404)
                .send()
        }
        res
            .status(200)
            .send({
                todo
            })
    }).catch((err) => {
        res
            .status(400)
            .send()
    })
})

app.patch('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id
    const body = _.pick(req.body, ['text', 'completed'])

    if (!ObjectID.isValid(id)) {
        return res
            .status(404)
            .send()
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime()
    } else {
        body.completed = false
        body.completedAt = null
    }

    Todo.findOneAndUpdate({
        _id: id,
        _owner: req.user._id
    }, {
        $set: body
    }, {
        new: true
    }).then((todo) => {
        if (!todo) {
            return res
                .status(404)
                .send()
        }
        res
            .status(200) 
            .send({
            todo
        })
    }).catch((err) => {
        res
            .status(400)
            .send()
    })
})

app.post('/boards', authenticate, (req, res) => {
    const board = new Board({
        _owner: req.user._id,
        title: req.body.title
    })

    board.save().then((doc) => {
        res.send(doc)
    }, (err) => {
        res.status(400).send(err)
    })
})

app.get('/boards', authenticate, (req, res) => {
    Board.find({
        _owner: req.user._id
    }).then((boards) => {
        res.send({
            boards
        })
    }, (err) => {
        res.send({
            err
        })
    })
})

app.post('/users', (req, res) => {
    const user = new User(_.pick(req.body, ['email', 'password']))
    user.save().then(() => {
        return user.generateAuthToken()
    }).then((token) => {
        res.header('x-auth', token).send(_.pick(user, ['_id', 'email']))
    }).catch((err) => {
        res.status(400).send(err)
    })
})

app.get('/users/me', authenticate, (req, res) => {
    res.send(_.pick(req.user, ['_id', 'email']))
})

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password'])

    User.findByCredentials(body.email, body.password).then((user) => {
        user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(_.pick(user, ['_id', 'email']))
        })
    }).catch((e) => {
        res.status(400).send()
    })  
})

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send()
    }, () => {
        res.status(400).send()
    })
})

app.listen(port, () => {
    console.log(`Started on port ${port}`)
})

module.exports = {app}