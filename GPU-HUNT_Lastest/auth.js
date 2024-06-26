var express = require('express');
var router = express.Router();
//var template = require('./template.js');

var db = require('./db');

const path = require('path');
router.use(express.static(path.join(__dirname, 'public')));


// 로그인 페이지
router.get('/login', function (req, res) {
  const htmlPath = path.resolve(__dirname + '/login.html');
  res.sendFile(htmlPath);
});

// 로그인 프로세스
router.post('/login_process', function (request, response) {
    var id = request.body.id;
    var password = request.body.password;
    if (id && password) {             // id와 pw가 입력되었는지 확인       
        db.query('SELECT * FROM users WHERE id = ? AND password = ?', [id, password], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {       // db에서의 반환값이 있으면 로그인 성공
                request.session.is_logined = true;      // 세션 정보 갱신
                request.session.nickname = id;
                request.session.save(function () {
                    response.redirect(`/`);
                });
            } else {              
                response.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
                document.location.href="/auth/login";</script>`);    
            }            
        });

    } else {
        response.send(`<script type="text/javascript">alert("아이디와 비밀번호를 입력하세요!"); 
        document.location.href="/auth/login";</script>`);    
    }
}); 

// 로그아웃
router.get('/logout', function (request, response) {
    request.session.destroy(function (err) {
        response.redirect('/');
    });
});

 // 회원가입 페이지
 router.get('/signup', function (req, res) {
  const htmlPath = path.resolve(__dirname + '/signup.html');
  res.sendFile(htmlPath);
});

const validCallNumberCheck = (callNumber) =>{
    callNumber = callNumber.replace(/-/g,'');
  //유효성 검사 
    const pattern = /^(01[016789]{1}|02|0[3-9]{1}[0-9]{1})([0-9]{3,4})([0-9]{4})$/;
    return pattern.test(callNumber);
    
}

// 회원가입 프로세스
router.post('/signup_process', function(request, response) {    
    var phone_number = request.body.phone_number;
    var id = request.body.id;
    var password = request.body.password;    
    var password2 = request.body.password2;
    if(!validCallNumberCheck(phone_number)){
      response.send(`<script type="text/javascript">alert("유효하지 않은 전화번호 입니다."); 
      document.location.href="/auth/signup";</script>`); 
    }
    else if (phone_number && id && password && password2) {
        phone_number = phone_number.replace(/-/g,'');
        db.query('SELECT * FROM users WHERE id = ?', [id], function(error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
            if (error) throw error;
            else if (results.length > 0) {                           // DB에 같은 이름의 회원아이디가 있는 경우
              response.send(`<script type="text/javascript">alert("이미 존재하는 아이디 입니다."); 
              document.location.href="/auth/signup";</script>`);   
            }
            else { 
              db.query('SELECT * FROM users WHERE phone_number = ?', [phone_number], function(error, results, fields) {
              if (error) throw error;
              if (results.length <= 0 && password == password2) {     // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우 
                  db.query('INSERT INTO users (phone_number, id, password) VALUES(?, ?, ?)', [phone_number, id, password], function (error, data) {
                      if (error) throw error;
                      response.send(`<script type="text/javascript">alert("회원가입이 완료되었습니다!");
                      document.location.href="/";</script>`);
                  });
              } else if (password != password2) {                     // 비밀번호가 올바르게 입력되지 않은 경우
                  response.send(`<script type="text/javascript">alert("입력된 비밀번호가 서로 다릅니다."); 
                  document.location.href="/auth/signup";</script>`);    
              } else {                                                  // DB에 같은 전화번호가 있는 경우
                  response.send(`<script type="text/javascript">alert("이미 존재하는 전화번호 입니다."); 
                  document.location.href="/auth/signup";</script>`);    
              }});
          }});
    }
    else {        // 입력되지 않은 정보가 있는 경우
        response.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="/auth/signup";</script>`);
      }});

// 정보 수정
router.post('/edit_process', function (req, res) {
    var id = req.session.nickname;
    var phone_number = req.body.phone_number;
    var password = req.body.password;    
    var password2 = req.body.password2;
    if(!validCallNumberCheck(phone_number)){
        res.send(`<script type="text/javascript">alert("유효하지 않은 전화번호 입니다."); 
        document.location.href="/checkout";</script>`); 
    } else if (phone_number && password && password2) { 
        phone_number = phone_number.replace(/-/g,'');
        db.query('SELECT * FROM users WHERE phone_number = ?', [phone_number], function(error, results, fields) {
            if (error) throw error;
            if (results.length <= 0 && password == password2) {     // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우 
                db.query('UPDATE users SET phone_number = ?, password = ? WHERE id = ?', [phone_number, password, id], function (error, data) {
                    if (error) throw error;
                    res.send(`<script type="text/javascript">alert("회원수정이 완료되었습니다!");
                    document.location.href="/my-account";</script>`);
                });
            } else if (password != password2) {                     // 비밀번호가 올바르게 입력되지 않은 경우
                res.send(`<script type="text/javascript">alert("입력된 비밀번호가 서로 다릅니다."); 
                document.location.href="/checkout";</script>`);    
            } else {                                                  // DB에 같은 전화번호가 있는 경우
                res.send(`<script type="text/javascript">alert("이미 존재하는 전화번호 입니다."); 
                document.location.href="/checkout";</script>`);    
            }});
    } else {        // 입력되지 않은 정보가 있는 경우
      res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
      document.location.href="/checkout";</script>`);
    }});
module.exports = router;