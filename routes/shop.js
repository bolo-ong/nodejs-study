let router = require('express').Router();


function isLogin(req, res, next){
    if(req.user){
        next()
    }else{
        res.send('로그인 후 이용해 주세요')
    }
}

router.use('/shirts', isLogin);


router.get('/shirts', (req, res) => {
    res.send('셔츠 파는 페이지입니다.')
})

router.get('/pants', (req, res) => {
    res.send('바지 파는 페이지입니다.')
})


module.exports = router;