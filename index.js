const express = require('express');
const app = express();

const uuidv4 = require('uuid/v4');

const cors = require('cors');
app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());

const mysql = require('mysql');
const db = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: 'charon',
    // database: 'coba_movietime_01'
    host: 'mcldisu5ppkm29wf.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'mfqe7pjw1yqnku1f',
    password: 'qhtezq8xhki8p2v3',
    database: 'ffgf4yfdlp7nly40'
});
db.connect();

app.get('/movie/:id', (req, res) => {
    let sql = `select * from  movie inner join screening on movie.id = screening.movie_id where movie_id = (select id from movie where moviedb_id = ${req.params.id})`;

    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });
})

app.get('/seat/:id', (req, res) => {
    let sql = `select * from seat_reserved left join reservation on seat_reserved.reservation_id = reservation.id where screening_id = '${req.params.id}' and active = 1`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });
})

app.post('/login', (req, res, next) => {
  passport.authenticate('local', function(err, user, info) {
    console.log("Infooo:", info)
    console.log("User:", user)
    
    if (user.kode == '001') {
        // nyimpen sessionID di server
        let sql = `INSERT INTO session(session_id, user_id) VALUES ('${user.session_id}',(select id from user where email='${user.email}'))`;
        db.query(sql, (err, result) => {
            if(err) throw err;
            //console.log("BERHASIUL KANNN")
            //res.cookie("MOVIETIME_SESSID", sessionID, {maxAge: 3600*5*1000, httpOnly:true})
            //res.cookie("MOVIETIME_SESSID", sessionID, {maxAge: new Date(Date.now).getTime() + (3600*5*1000)})
            res.send(user)
            console.log(user)   
        })
    } else {
        res.send(user)
    }
    
  }) (req, res, next);
});


passport.use(new LocalStrategy ({
    usernameField: 'email',
    passwordField: 'password',
    //passReqToCallback: true,
},
    (email, password, done) => {
        console.log(email)
        console.log(password)
        //console.log("HUEHEHEHEH",req)

        let sql =  `select count(*) hitung from user where email = '${email}' and password = '${password}'`
        db.query(sql, (err, result) => {
        
        if (err) throw err;

        if (result[0].hitung == 1){
            console.log(`Berhasil`)
            let sessionID = uuidv4()
            return done(null, { kode: '001', email: email, session_id: sessionID });

        } else {
            console.log(`Gagal`)
            return done(null, false, { message: 'Incorrect username or password.' });
        }                      
        })
    }
))

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/',
                                   failureFlash: true })
);

app.post('/register', (req, res) => {
    // console.log(req.body)
    let sql = 'INSERT INTO user SET ?';
    let data = {email: req.body.email, password: req.body.password, passwordConfirm: req.body.passwordConfirm}
    db.query(sql, data, (err, result) => {
        if(err) throw err;
        console.log(result);
        res.send({
            kode: '001',
            status: 'Berhasil',
		    email: req.body.email,
	});
    })
})

app.post('/createreservation', (req, res) => {
    var sql1 = `insert into reservation values ( null, now(), '${req.body.screening}', (select id from user where email = '${req.body.email}' and password = '${req.body.password}'),0)`
    db.query(sql1, (err, result) => {
        if (err) throw err;

        for (let i=0; i<req.body.seat.length; i++){
            var seat_id = `${req.body.theater}${req.body.seat[i]}`
            var sql3 = `insert into seat_reserved values (null, '${seat_id}', ${result.insertId})`
            console.log(sql3)
            db.query(sql3, (err, result) => {
                if (err) throw err;
            })
        }

        res.send({
            status: 'Dari backend: berhasil create reservation'
        })

    })
})

app.post('/cookie', (req, res) => {
    console.log(`Ini req.body cookie: ${req.body.cookieMovietime}`)

    let sql =  `select count(*) hitung from session where session_id = '${req.body.cookieMovietime}'`    
    db.query(sql, (err, result) => {

        if (result[0].hitung == 1){
            console.log(`Berhasil`)
            res.send({
                kode: '001',
                status: 'Ada session dengan cookie tersebut di server'
            });

        } else {
            console.log(`Gagal`)
            res.send({
                kode: '002',
                status: 'Tidak ada session dengan cookie tersebut di server'
            });
        }    
    });
})

app.post('/signout', (req, res) => {
    console.log(req.body.cookieMovietime)
    let sql =  `delete from session where session_id = '${req.body.cookieMovietime}'`
    // console.log(sql)
    db.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result);
        res.send({
            kode: '001',
            status: 'Berhasil hapus session',
	});
    })
})

app.post('/adminlogin', (req, res) => {
    let sql =  `select count(*) hitung from admin where username='${req.body.username}' and password='${req.body.password}';`
    db.query(sql, (err, result) => {
        if (result[0].hitung == 1){
            console.log(`Berhasil`)
            res.send({
                kode: '001',
                status: 'Admin berhasil login'
            });

        } else {
            console.log(`Gagal`)
            res.send({
                kode: '002',
                status: 'Admin gagal login'
            });
        }
    })
})

app.listen(5001, () => {
    console.log(`Listening to port 5001`)
});