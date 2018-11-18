const {ObjectID} = require('mongodb')
const jwt = require('jsonwebtoken')

const {Todo} = require('./../../models/todo')
const {Board} = require('./../../models/board')
const {List} = require('./../../models/list')
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

const firstBoardID = new ObjectID()
const secondBoardID = new ObjectID()
const thirdBoardID = new ObjectID()
const boards = [
    {
        _owner: firstUserID,
        _id: firstBoardID,
        title: 'First test board'
    },
    {
        _owner: firstUserID,
        _id: secondBoardID,
        title: 'Second test board',
    },
    {
        _owner: secondUserID,
        _id: thirdBoardID,
        title: 'Third test board'
    }
]


const firstListID = new ObjectID()
const secondListID = new ObjectID()
const thirdListID = new ObjectID()
const lists = [
    {
        _owner: firstUserID,
        _parent: firstBoardID,
        _id: firstListID,
        title: 'First test list'
    },
    {
        _owner: firstUserID,
        _parent: firstBoardID,
        _id: secondListID,
        title: 'Second test list',
    },
    {
        _owner: secondUserID,
        _parent: secondBoardID,
        _id: thirdListID,
        title: 'Third test list'
    }
]

const todos = [
    {
        _owner: firstUserID,
        _parent: firstListID,
        _id: new ObjectID(),
        text: 'First test todo',
        completed: true,
        completedAt: 1337
    },
    {
        _owner: firstUserID,
        _parent: firstListID,
        _id: new ObjectID(),
        text: 'Second test todo'
    },
    {
        _owner: secondUserID,
        _parent: secondListID,
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

const fillLists = (done) => {
    List.deleteMany({}).then(() => {
        return List.insertMany(lists)
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
    lists,
    users,
    fillTodos,
    fillBoards,
    fillLists,
    fillUsers
}