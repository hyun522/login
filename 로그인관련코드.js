/*passport  passport-local  express-session 설치후 불러오기
    로그인 검정 및 세션 생성에 필요한 기능 사용
*/
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');


app.use(session({secret :'secret', resave : false, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session()); 



/* */

passport.use(new LocalStrategy({
    usernameField:"로그인 화면에서 입력한 input태그 아이디 name값",
    passwordField:"로그인 화면에서 입력한 input태그 비번 name값",
    session:true,
    },      //해당 name값은 아래 매개변수에 저장
    function(memberid, memberpass, done) {
                    //회원정보 콜렉션에 저장된 아이디랑 입력한 아이디랑 같은지 체크                                 
      db.collection("members").findOne({ memberid:memberid }, function (err, user) {
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
//위에 있는 옵션을 담아서 쓰겠단 뜻
//로그인 경로로 요청시 위의 passport의 옵션 설정을 통한 체크 
passport.authenticate('local', {failureRedirect : '/fail'})


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

