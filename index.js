const express = require("express");
const MongoClient = require("mongodb").MongoClient;
//데이터베이스의 데이터 입력,출력을 위한 함수명령어 불러들이는 작업
const app = express();
const port = 5000;


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');


app.use(session({secret :'secret', resave : false, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session()); 




//ejs 태그를 사용하기 위한 세팅
app.set("view engine","ejs");
//사용자가 입력한 데이터값을 주소로 통해서 전달되는 것을 변환(parsing)
app.use(express.urlencoded({extended: true}));
app.use(express.json()) 
//css/img/js(정적인 파일)사용하려면 이코드를 작성!
app.use(express.static('public'));

let db; //데이터베이스 연결을 위한 변수세팅(변수의 이름은 자유롭게 지어도 됨)

MongoClient.connect("mongodb+srv://nnsghd:jhj5374v*m@cluster0.oafanwb.mongodb.net/?retryWrites=true&w=majority",function(err,result){
    //에러가 발생했을경우 메세지 출력(선택사항)
    if(err) { return console.log(err); }

    //위에서 만든 db변수에 최종연결 ()안에는 mongodb atlas 사이트에서 생성한 데이터베이스 이름
    db = result.db("board_final");

    //db연결이 제대로 됬다면 서버실행
    app.listen(port,function(){
        console.log("서버연결 성공");
    });

});
// 로그인 했을 때 검증 처리
// 흐름 설명해줌
passport.use(new LocalStrategy({
    usernameField:"memberid",
                //"로그인 화면에서 입력한 input태그 아이디 name값"
    passwordField:"memberpass",
                //"로그인 화면에서 입력한 input태그 비번 name값"
    session:true,
    },      //해당 name값은 아래 매개변수에 저장
    function(memberid, memberpass, done) {
                    //회원정보 콜렉션에 저장된 아이디랑 입력한 아이디랑 같은지 체크                                 
      db.collection("members").findOne({ memberid:memberid }, function (err, user) {
        // 공식페이지에서 제공하는 id에 관한 조건문
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        //비밀번호 체크 여기서 user는 db에 저장된 아이디의 비번값
        if (memberpass == user.memberpass) {
            return done(null, user)
          } else {
            return done(null, false)
          }
      });
    }
  ));

//처음 로그인 했을 시 세션 생성 memberid는 데이터에 베이스에 로그인된 아이디
 passport.serializeUser(function (user, done) {
 done(null, user.memberid)
});
  
//다른 페이지(서브페이지,게시판 페이지 등 로그인 상태를 계속 표기하기 위한 작업)
//로그인이 되있는 상태인지 체크
passport.deserializeUser(function (memberid, done) {
 db.collection('members').findOne({memberid:memberid }, function (err,result) {
    done(null, result);
    })
}); 


app.get("/",function(req,res){
    res.render("index.ejs",{login:req.user});
});

//다른 서브페이지들도 로그인되어있는 회원정보 데이터 보내야함
app.get("/board",(req,res)=>{
    res.render("boardlist.ejs",{login:req.user});
});

//<join.ejs>
//회원가입 페이지 화면으로 가기위한 경로요청 
app.get("/join",(req,res)=>{
    res.render("join.ejs");
})
//회원가입 데이터 db에 저장요청(form태그 actin경로)
app.post("/joindb",(req,res)=>{
    // 아이디 입력 저장값은 프로퍼티 이름 memberid
    // 비밀번호 입력 저장값은 프로퍼티 이름 memberpass
                            // 데이터를 찾았을떄(현재 id로만 check하겠다!)
    db.collection("members").findOne({memberid:req.body.memberid},(err,member)=>{
        // 데이터가 있을때
        if(member){ 
            res.send("<script> alert('이미 가입된 아이디입니다'); location.href='/join' </script>")
            //send = 자바스크립트 구문을 삽일할때도 사용가능
            //redirect는 경로밖에 못쓰기 때문에 경고창 띄우고 싶어서
        } 
        // 데이터가 없을때
        else{
            db.collection("count").findOne({name:"회원"},(err,result)=>{
                // mongodb-members에 데이터를 삽입해주겠다! 이름 작명해서 넣어준다 작명한 이름까지 db에 들어가게된다!
                db.collection("members").insertOne({
                    memberno:result.memberCount,
                    memberid:req.body.memberid,
                    // /joindb에서 가져온 정보
                    memberpass:req.body.memberpass,
                },(err)=>{
                    db.collection("count").updateOne({name:"회원"},{$inc:{memberCount:1}},(err)=>{
                        res.send("<script>alert('회원가입완료'); location.href='/login' </script>")
                    })
                })
            })
        }

    })
})

app.get("/login",(req,res)=>{
    res.render("login.ejs")
})

//<login.ejs>
// 로그인 처리 요청경로 ★새로운 명령어!!!
app.post("/logincheck",passport.authenticate('local', {failureRedirect : '/login'})
,(req,res)=>{
    res.redirect("/"); //로그인 성공시 메인페이지로 이동
})
// 로그아웃 처리 요청경로
app.get("/logout",(req,res)=>{
    //로그아웃 함수 적용후 메인페이지로 이동
    req.logout(()=>{
        //logout 함수는 서버에 있는 세션을 제거해주는 역할
        res.redirect("/")
    })
})
// 마이페이지 보여주는 경로
app.get("/mypage",(req,res)=>{
    res.render("mypage",{login:req.user})
    // login:req.user
})

//회원정보 수정후 db에 수정요청
app.post("/myupdate",(req,res)=>{
    //수정페이지에서 입력한 기존 비밀번호와 로그인 하고있는 중의 비밀번호와 일치하는지 비교
    if(req.body.originPass === req.user.memberpass){
                        //로그인하고 있는 유저의 아이디
        db.collection("members").updateOne({memberid:req.user.memberid},
            {$set:{memberpass:req.body.changePass}},(err)=>{ res.redirect("/"); })
    } 
    // if(내가입력한원래비밀번호 === 로그인하고 있는 비밀번호) 
    else{
        res.send("<script>alert('기존 비밀번호랑 일치하지 않습니다'); location.href = '/mypage'; </script>")
    }
})
