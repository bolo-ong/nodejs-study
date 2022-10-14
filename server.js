const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: true }))
const MongoClient = require('mongodb').MongoClient
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.set('view engine', 'ejs')

app.use('/public', express.static('public'))

var db
MongoClient.connect('mongodb+srv://bolo:minwon0521@cluster0.hrkz1cc.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true }, (error, client) => {
    db = client.db('todoapp')

    if (error) {
        return console.log(error)
    }

    app.listen(8080, () => {
        console.log('listening on 8080')
    })
})


app.get('/', (req, res) => {
    res.render('index.ejs')
})
app.get('/write', function (req, res) {
    res.render('write.ejs')
})

app.post('/add', (req, res) => {
    res.send('전송완료')

    db.collection('counter').findOne({ name: '게시물 개수' }, (error, result) => {
        let totalNotice = result.totalPost

        db.collection('post').insertOne({ _id: totalNotice + 1, 제목: req.body.title, 날짜: req.body.date }, (error, result) => {
            console.log('저장완료')
            db.collection('counter').updateOne({ name: '게시물 개수' }, { $inc: { totalPost: 1 } }, (error, result) => {
                if (error) { return console.log(error) }
            })
        })
    })
})

app.get('/list', (req, res) => {
    db.collection('post').find().toArray((error, result) => {
        console.log(result)
        res.render('list.ejs', { posts: result })
    })
})

app.delete('/delete/:id', (req, res) => {
    req.body._id = parseInt(req.body._id)
    console.log(req.body)
    db.collection('post').deleteOne(req.body, (error, result) => {
        console.log('삭제완료')
        res.status(200).send({ message: '성공함' })
    })
})

app.get('/detail/:id', (req, res) => {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, (error, result) => {
        console.log(result)
        res.render('detail.ejs', { data: result })
        if (result == null) {
            res.status(404).send({ message: '없엉' })
        }
    })
})

app.get('/edit/:id', (req, res) => {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, (error, result) => {
        console.log(result)
        res.render('edit.ejs', { post: result })
        if (result == null) {
            res.status(404).send({ message: '없엉' })
        }
    })
})

app.put('/edit', (req, res) => {
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { 제목: req.body.title, 날짜: req.body.date } }, (error, result) => {
        console.log('수정완료')
        res.redirect('/list')
    })
})


const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')

app.use(session({ secret : '비밀코드', resave : true, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), (req, res) => {
    res.redirect('/')
})

app.get('/mypage', isLogin, (req, res) => {
    res.render('mypage.ejs', {user : req.user})
})

function isLogin(req, res, next){
    if(req.user){
        next()
    }else{
        res.send('로그인 후 이용해 주세요')
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) {
        if (error) return done(error)

        if (!result) return done(null, false, { message: '존재하지않는 아이디요' })
        if (입력한비번 == result.pw) {
            return done(null, result)
        } else {
            return done(null, false, { message: '비번틀렸어요' })
        }
    })
}));

passport.serializeUser((user, done) => {
    done(null, user.id)
})
passport.deserializeUser((userID, done) => {
    db.collection('login').findOne({id : userID}, (error, result) => {
        done(null, result)
    })
})