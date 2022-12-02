const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: true }))
const MongoClient = require('mongodb').MongoClient
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

require('dotenv').config()

app.set('view engine', 'ejs')

app.use('/public', express.static('public'))

var db
MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, (error, client) => {
    db = client.db('todoapp')

    if (error) {
        return console.log(error)
    }

    app.listen(process.env.PORT, () => {
        console.log('listening on 8080')
    })
})


app.get('/', (req, res) => {
    res.render('index.ejs')
})
app.get('/write', function (req, res) {
    res.render('write.ejs')
})

app.get('/list', (req, res) => {
    db.collection('post').find().toArray((error, result) => {
        res.render('list.ejs', { posts: result })
    })
})

app.get('/search', (req, res) => {
    
    let searchCondition = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: "제목" //제목날짜 둘 다 찾고 싶으면 ['제목', '날짜']
                }
            }
        },
        //{$project : {제목: 1, _id: 0, score: {$meta: "searchScore"}}},
        {$sort : {_id : 1}}
    ]
    db.collection('post').aggregate(searchCondition).toArray((error, result) => {
        console.log(result)
        res.render('search.ejs', { posts: result })
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


const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')
const e = require('express')

app.use(session({ secret : '비밀코드', resave : true, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), (req, res) => {
    res.redirect('/list')
})

app.get('/mypage', isLogin, (req, res) => {
    res.render('mypage.ejs', {user : req.user})
})

function isLogin(req, res, next){
    if(req.user){
        next()
    }else{
        res.send("<script>alert('로그인 후 이용해 주세요.');history.back();</script>")
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


app.post('/register', (req, res) => {
    db.collection('login').findOne({id : req.body.id}, (error, result) => {
        if(error){
            console.log(error)
        }
        if(result){
            res.send("<script>alert('이미 존재하는 id입니다.');history.back();</script>")
        }
        if(!result){
            db.collection('login').insertOne({id:req.body.id, pw:req.body.pw}, (error, result) => {
                res.redirect('/')
            })
        }
    }
)}
)

app.post('/add', isLogin,(req, res) => {
    res.redirect('/list')

    db.collection('counter').findOne({ name: '게시물 개수' }, (error, result) => {
        let totalNotice = result.totalPost
        let postContents = { 
            _id: totalNotice + 1, 
            작성자: req.user._id, 
            닉네임: req.user.id, 
            제목: req.body.title, 
            날짜: req.body.date, 
            작성일: new Date() }

        db.collection('post').insertOne(postContents, (error, result) => {
            console.log('저장완료')
            db.collection('counter').updateOne({ name: '게시물 개수' }, { $inc: { totalPost: 1 } }, (error, result) => {
                if (error) { return console.log(error) }
            })
        })
    })
})

app.delete('/delete/:_id', (req, res) => {
    req.params._id = parseInt(req.params._id)
    console.log(req.params._id)

    let deleteData = { _id: req.params._id, 작성자: req.user._id }

    db.collection('post').deleteOne(deleteData, (error, result) => {
        console.log('삭제완료')
        res.status(200).send({ message: '성공함' })
    })
})

app.put('/edit', (req, res) => {
    let editData = { _id: parseInt(req.body.id), 작성자: req.user._id }

    db.collection('post').updateOne(editData, { $set: { 제목: req.body.title, 날짜: req.body.date } }, (error, result) => {
        console.log(editData)
        console.log('수정완료')
        res.redirect('/list')
    })
})

app.use('/shop', require('./routes/shop.js'));
// app.get('/shop/shirts', (req, res) => {
//     res.send('셔츠 파는 페이지입니다.')
// })

// app.get('/shop/pants', (req, res) => {
//     res.send('바지 파는 페이지입니다.')
// })

app.use('/board/sub', require('./routes/board.js'));


let multer = require('multer');
var storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, './public/image')
    },
    filename : (req, file, cb) => {
        cb(null, file.originalname + 날짜 + new Date())
    },
    fileFilter : function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error('PNG, JPG만 업로드하세요'))
        }
        callback(null, true)
    },
    // limits:{
    //     fileSize: 1024 * 1024
    // }
});

var upload = multer({storage : storage});

app.get('/upload', (req, res) => {
    res.render('upload.ejs')
})

app.post('/upload', upload.single('profile'), (req, res) => {
    res.send('업로드 완료')
})

app.get('/image/:imageName', (req, res) => {
    res.sendFile( __dirname + '/public/image/' + req.params.imageName )
})

app.post('/chatroom/:_id', isLogin, (req, res) => {
    db.collection('post').findOne({_id: parseInt(req.params._id)}, (error, result) => {

        let chatPartner = result['닉네임']
        let chatMember = [chatPartner, req.user.id]
        let chatContents = {
            parentId: result['_id'],
            member: chatMember, 
            date: new Date(), 
            title: result['제목']
        }

        db.collection('chatroom').findOne({parentId: result['_id']}, (error, result) => {
            if(!result){
                db.collection('chatroom').insertOne(chatContents, (error, result) => {
                    console.log('채팅방 개설 완료')
                    res.redirect('/chatroom/' + req.params._id)
                })
            }

            if(result){
                result['member'].push(req.user.id)
                let setNewChatMember = Array.from(new Set(result['member']))

                if(JSON.stringify(chatMember) == JSON.stringify(setNewChatMember)){
                    console.log('채팅방 이동 완료')
                    res.redirect('/chatroom/' + req.params._id)
                }
                else{
                    db.collection('chatroom').updateOne({parentId: parseInt(req.params._id)}, { $set: { member: setNewChatMember } }, (error, result) => {
                        console.log('채팅방 참가 완료')
                        res.redirect('/chatroom/' + req.params._id)
                    })
                }
            }
        })
    })
})


app.get('/chatroom/:_id', (req, res) => {
    db.collection('message').find({parentRoom: parseInt(req.params._id)}).toArray((error, result) => {
        let messageData = result

        db.collection('chatroom').find({member: req.user.id}).toArray((error, result) => {
            let chatRoomData = result

            res.render('chat.ejs', {message: messageData, data: chatRoomData})
        })
    })
})


app.post('/chat', isLogin, (req, res) => {
        let messageContents = {
            parentRoom: parseInt(req.body.parent),
            채팅: req.body.content,
            발신: req.user.id,
            날짜: new Date()
        }

        db.collection('message').insertOne(messageContents, (error, result) => {
            console.log('채팅완료')
            res.send('ok')
            // res.redirect('/chatroom/' + parseInt(req.body.parent))
        })
})


app.get('/message/:id', isLogin, (req, res) => {
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
    })

    // db.collection('message').find({parentRoom: parseInt(req.params.id)}).toArray((error, result) => {
    //     res.write('event: test\n');
    //     res.write(`data: ${JSON.stringify(result)}\n\n`);
    // })

    const pipeline = [
        { $match: { 'fullDocument.parentRoom': parseInt(req.params.id)} }
    ];
    const collection = db.collection('message');
    const changeStream = collection.watch(pipeline);
    changeStream.on('change', (result) => {
        res.write('event: test\n');
        res.write(`data: ${JSON.stringify([result.fullDocument])}\n\n`)
    });
});