//for Cloud9
let port = process.env.PORT;
let ip = process.env.IP;
//main backend file
//required dependencies
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express() //instance of express app
const mongoose = require('mongoose')
mongoose.connect(`mongodb://${ip}:27017/epicchat`, {useNewUrlParser: true})
const server = require('http').Server(app) //websocket has http server dependency
const io = require('socket.io')(server)



mongoose.Promise = global.Promise
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '../dist')))

//use Websockets
io.on('connection', (socket) => {
  let user = '';

  socket.on('new message', (data) => {
    const newMessage = new Message({
      _id: mongoose.Types.ObjectId(),
      message: data,
      user: user
    })
    newMessage.save().then(rec => {
      if(rec) {
        io.emit('message recieved', rec)
      } else {
      }
    })
  })
  socket.on('new user', (data) => {
    user = data;
    console.log(`${user} is connected`) //send to terminal if a new user is connected
    socket.broadcast.emit('user connected', data); //sends event to everyone except to sender
    Message.find().then(rec => {
      if(rec) {
        socket.emit('all messages', rec)
      } else {
      }
    })
  })
  socket.on('disconnect', () => {
    socket.broadcast.emit('user disconnected', user);
    console.log(`${user} disconnected`)
  })
})

const Message = require('./models/message') //to use the schema in the APIs

//API to get all the chat. uses HTTP protocol
app.get('/api/chat', (req, res) => {
  Message.find().then(rec => { //send to the browser any record found from DB
    if(rec) {
      res.send(rec)
    } else {
      res.send([]) // else send an empty array
    }
  })
})

//API to POST the chats to the database
app.post('/api/chat', (req, res) => {
  const newMessage = new Message({
    _id: mongoose.Types.ObjectId(),
    message: req.body.message,
    user: 'user' //default user
  })
  newMessage.save().then(rec => {
    if(rec) {
      res.send(rec)
    } else {
      res.send([])
    }
  })
})
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})


server.listen(port, () => console.log(`Listening on port ${port}`))