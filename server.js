const express = require('express')
const app = express()
app.use(express.urlencoded({extended: true}))
const MongoClient = require('mongodb').MongoClient
app.set('view engine', 'ejs')


var db
MongoClient.connect('mongodb+srv://bolo:minwon0521@cluster0.hrkz1cc.mongodb.net/?retryWrites=true&w=majority', {useUnifiedTopology:true}, (error, client) => {
    db = client.db('todoapp')

    if(error){
        return console.log(error)
    }

    app.listen(8080, () => {
        console.log('listening on 8080')
    })
})


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})
app.get('/write', function(req, res){
    res.sendFile(__dirname + '/write.html')
})

app.post('/add', (req, res) => {
    res.send('전송완료')
    
    db.collection('counter').findOne({name : '게시물 개수'}, (error, result) => {
        let totalNotice = result.totalPost
        
        db.collection('post').insertOne({ _id : totalNotice + 1, 제목 : req.body.title, 날짜 : req.body.date}, (error, result) => {
            console.log('저장완료')
            db.collection('counter').updateOne({name : '게시물 개수'}, {$inc : {totalPost:1}}, (error, result) => {
                if(error){return console.log(error)}
            })
        })
    })
})

app.get('/list', (req, res) => {
    db.collection('post').find().toArray((error, result) => {
        console.log(result)
        res.render('list.ejs', {posts : result})
    })
})

app.delete('/delete', (req, res) => {
    req.body._id = parseInt(req.body._id)
    console.log(req.body)
    db.collection('post').deleteOne(req.body, (error, result) => {
        console.log('삭제완료')
    })
})

