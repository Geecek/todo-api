const {ObjectID} = require('mongodb')
const jwt = require('jsonwebtoken')

const {Todo} = require('./../../models/todo')
const {Board} = require('./../../models/board')
const {User} = require('./../../models/user')

const firstUserID = new ObjectID()
const secondUserID = new ObjectID()
const users = [{
    _id: firstUserID,
    email: 'test@example.com',
    password: 'password123',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: firstUserID, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}, {
    _id: secondUserID,
    email: 'test2@example.com',
    password: 'passwordxd',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: secondUserID, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}]

const boards = [
    {
        _owner: firstUserID,
        _id: new ObjectID(),
        title: 'First test board'
    },
    {
        _owner: firstUserID,
        _id: new ObjectID(),
        title: 'Second test board',
    },
    {
        _owner: secondUserID,
        _id: new ObjectID(),
        title: 'Third test board'
    }
]

const todos = [
    {
        _owner: firstUserID,
        _id: new ObjectID(),
        text: 'First test todo',
        completed: true,
        completedAt: 1337
    },
    {
        _owner: firstUserID,
        _id: new ObjectID(),
        text: 'Second test todo'
    },
    {
        _owner: secondUserID,
        _id: new ObjectID(),
        text: 'Third test todo'
    }
]

const fillTodos = (done) => {
    Todo.deleteMany({}).then(() => {
        return Todo.insertMany(todos)
    }).then(() => done())
}

const fillBoards = (done) => {
    Board.deleteMany({}).then(() => {
        return Board.insertMany(boards)
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
    boards,
    users,
    fillTodos,
    fillBoards,
    fillUsers
}