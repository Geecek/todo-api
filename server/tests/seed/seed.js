const {ObjectID} = require('mongodb')
const jwt = require('jsonwebtoken')

const {Todo} = require('./../../models/todo')
const {User} = require('./../../models/user')

const todos = [
    {
        _id: new ObjectID(),
        text: 'First test todo',
        completed: true,
        completedAt: 1337
    },
    {
        _id: new ObjectID(),
        text: 'Second test todo'
    },
    {
        _id: new ObjectID(),
        text: 'Third test todo'
    }
]

const firstUserID = new ObjectID()
const secondUserID = new ObjectID()
const users = [{
    _id: firstUserID,
    email: 'test@example.com',
    password: 'password123',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: firstUserID, access: 'auth'}, '123123').toString()
    }]
}, {
    _id: secondUserID,
    email: 'test2@example.com',
    password: 'passwordxd'
}]

const fillTodos = (done) => {
    Todo.deleteMany({}).then(() => {
        return Todo.insertMany(todos)
    }).then(() => done())
}

const fillUsers = (done) => {
    User.remove({}).then(() => {
        const firstUser = new User(users[0]).save()
        const secondUser = new User(users[1]).save()
        return Promise.all([firstUser, secondUser])
    }).then(() => done())
}

module.exports = {
    todos,
    users,
    fillTodos,
    fillUsers
}