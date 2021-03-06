const expect = require('expect')
const request = require('supertest')
const {ObjectID} = require('mongodb')

const {app} = require('./../server')
const {Todo} = require('./../models/todo')
const {Board} = require('./../models/board')
const {List} = require('./../models/list')
const {User} = require('./../models/user')
const {
    todos, fillTodos,
    boards, fillBoards,
    lists, fillLists,
    users, fillUsers,
} = require('./seed/seed')

beforeEach(fillUsers)
beforeEach(fillTodos)
beforeEach(fillBoards)
beforeEach(fillLists)

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        const text = 'Test todo text'

        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({
                text,
                _id: lists[0]._id
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text)
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Todo
                    .find({text})
                    .then((todos) => {
                        expect(todos.length).toBe(1)
                        expect(todos[0].text).toBe(text)
                        done()
                    })
                    .catch((e) => done(e))
            })
    })

    it('should not create todo with invalid data', (done) => {
        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Todo.find().then((todos) => {
                    expect(todos.length).toBe(3)
                    done()
                }).catch((err) => done(err))
            })
    })
})

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2)
            })
            .end(done)
    })
})

describe('GET /todos/:id', () => {
    it('should return a todo', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text)
            })
            .end(done)
    })

    it('should return a todo owned by other user', (done) => {
        request(app)
            .get(`/todos/${todos[2]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })

    it('should return 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })

    it('should return 404 for invalid object ids', (done) => {
        request(app)
            .get('/todos/1337')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })
})

describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
        const id = todos[0]._id.toHexString()
        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(id)
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Todo.findById(id).then((todo) => {
                    expect(todo).toBeFalsy()
                    done()
                }).catch((err) => done(err))
            })
    })

    it('should not remove a todo owned by other user', (done) => {
        const id = todos[1]._id.toHexString()
        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Todo.findById(id).then((todo) => {
                    expect(todo).toBeTruthy()
                    done()
                }).catch((err) => done(err))
            })
    })

    it('should return 404 if todo not found', (done) => {
        request(app)
            .delete(`/todos/${new ObjectID().toHexString()}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done)
    })

    it('should return 404 for invalid object ids', (done) => {
        request(app)
            .delete('/todos/1337')
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done)
    })
})

describe('PATCH /todos/:id' , () => {
    it('should update the todo', (done) => {
        const id = todos[1]._id.toHexString()
        const text = 'New test todo'
        const _parent = lists[1]._id.toHexString()

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({
                text,
                completed: true,
                _parent
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text)
                expect(res.body.todo.completed).toBe(true)
                expect(typeof res.body.todo.completedAt).toBe('number')
                expect(res.body.todo._parent).toBe(_parent)
            })
            .end(done)
    })

    it('should not update the todo owned by other user', (done) => {
        const id = todos[2]._id.toHexString()
        const text = 'New test todo'

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({
                text,
                completed: true
            })
            .expect(404)
            .end(done)
    })

    it('should clear completedAt when todo is not completed', (done) => {
        const id = todos[0]._id.toHexString()
        const text = 'New not completed todo'

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({
                text,
                completed: false,
                completedAt: null
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text)
                expect(res.body.todo.completed).toBe(false)
                expect(res.body.todo.completedAt).toBeFalsy()
            })
            .end(done)
    })
})

describe('POST /boards', () => {
    it('should create a new board', (done) => {
        const title = 'Test board title'

        request(app)
            .post('/boards')
            .set('x-auth', users[0].tokens[0].token)
            .send({
                title
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.title).toBe(title)
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Board
                    .find({title})
                    .then((boards) => {
                        expect(boards.length).toBe(1)
                        expect(boards[0].title).toBe(title)
                        done()
                    })
                    .catch((e) => done(e))
            })
    })

    it('should not create board with invalid data', (done) => {
        request(app)
            .post('/boards')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Board.find().then((boards) => {
                    expect(boards.length).toBe(3)
                    done()
                }).catch((err) => done(err))
            })
    })
})

describe('GET /boards', () => {
    it('should get all boards', (done) => {
        request(app)
            .get('/boards')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.boards.length).toBe(2)
            })
            .end(done)
    })
})

describe('POST /lists', () => {
    it('should create a new list', (done) => {
        const title = 'Test list title'
        const _id = boards[0]._id
        request(app)
            .post('/lists')
            .set('x-auth', users[0].tokens[0].token)
            .send({
                title,
                _id
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.title).toBe(title)
                expect(res.body._parent).toBe(_id.toHexString())
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                List
                    .find({ title, _parent: _id })
                    .then((lists) => {
                        expect(lists.length).toBe(1)
                        expect(lists[0].title).toBe(title)
                        expect(lists[0]._parent).toEqual(_id)
                        done()
                    })
                    .catch((e) => done(e))
            })
    })

    it('should not create list with invalid data', (done) => {
        request(app)
            .post('/lists')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                List.find().then((lists) => {
                    expect(lists.length).toBe(3)
                    done()
                }).catch((err) => done(err))
            })
    })
})

describe('GET /lists', () => {
    it('should get all lists', (done) => {
        request(app)
            .get('/lists')
            .set('x-auth', users[0].tokens[0].token)
            .query({ _id: boards[0]._id.toHexString() })
            .expect(200)
            .expect((res) => {
                expect(res.body.lists.length).toBe(2)
            })
            .end(done)
    })
})

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString())
                expect(res.body.email).toBe(users[0].email)
            })
            .end(done)
    })

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({})
            })
            .end(done)
    })
})

describe('POST /users', () => {
    it('should create user', (done) => {
        const email = 'email@example.com'
        request(app)
            .post('/users')
            .send({
                email,
                password: 'lele123!'
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy()
                expect(res.body._id).toBeTruthy()
                expect(res.body.email).toBe(email)
            })
            .end(done)
    })

    it('should not create user if passed invalid email', (done) => {
        request(app)
            .post('/users')
            .send({
                email: 'asdfa@asssss.',
                password: 'sdasdasd123'
            })
            .expect(400)
            .expect((res) => {
                expect(res.body._message).toEqual('User validation failed')
            })
            .end(done)
    })

    it('should not create user if passed invalid password', (done) => {
        request(app)
            .post('/users')
            .send({
                email: 'test@lele.pl',
                password: 'sdasd'
            })
            .expect(400)
            .expect((res) => {
                expect(res.body._message).toEqual('User validation failed')
            })
            .end(done)
    })

    it('should not create user if passed used email', (done) => {
        request(app)
            .post('/users')
            .send({
                email: users[0].email,
                password: 'validpassword123!'
            })
            .expect(400)
            .expect((res) => {
                expect(res.body.code).toEqual(11000)
            })
            .end(done)
    })
})

describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy()
            })
            .end(done)
    })

    it('should not login user with invalid credentials', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: 'invalidpassword'
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeFalsy()
            })
            .end(done)
    })
})

describe('DELETE /users/me/token', () => {
    it('should remove auth token', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }

                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toEqual(0)
                    done()
                }).catch((err) => done(err))
            })
    })
})