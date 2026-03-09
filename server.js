const cookieParser = require("cookie-parser");
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const db = require('./db.js');

const app = express();
const SECRET = 'simplekey'; // Change in production

app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for JWT auth
const authenticate = (req, res, next) => {
  let token = req.cookies.token;
  if (!token) token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.redirect('/login');
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
};


// Routes
app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => res.render('login', { error: req.query.error }));

/*app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email=? OR regnum=?", [email, email], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.redirect('/login?error=Invalid credentials');
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET);
    res.cookie('token', token).redirect(user.role === 'admin' ? '/admin' : '/complaint');
  });
});
*/
app.get('/register', (req, res) => res.render('register', { error: req.query.error }));

app.post('/register', (req, res) => {
  const { email, regnum, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    db.run("INSERT INTO users (email, regnum, password) VALUES (?, ?, ?)", [email, regnum, hash], function(err) {
      if (err) return res.redirect('/register?error=User exists');
      res.redirect('/login');
    });
  });
});

app.get('/complaint', authenticate, (req, res) => res.render('complaint'));

app.post('/complaint', authenticate, (req, res) => {
  const { description, category } = req.body;
  db.run("INSERT INTO complaints (student_email, description, category) VALUES (?, ?, ?)",
    [req.user.email, description, category], () => res.redirect('/complaint'));
});

app.get('/admin', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.redirect('/complaint');
  db.all("SELECT * FROM complaints ORDER BY date DESC", (err, complaints) => {
    res.render('admin', { complaints });
  });
});

app.post('/update/:id', authenticate, (req, res) => {
 
 // Temporary logs...used to check if the target route was hit
 //  console.log('UPDATE ROUTE HIT');
  //console.log('ID:', req.params.id);
 // console.log('BODY:', req.body);

 
 
 
 
  if (req.user.role !== 'admin') {
    return res.redirect('/complaint');
  }

  const complaintId = Number(req.params.id);
  const { status } = req.body;

  db.run(
    "UPDATE complaints SET status=? WHERE id=?",
    [status, complaintId],
    (err) => {
      if (err) {
        console.error(err);
      }
      res.redirect('/admin');
    }
  );
  
  // Debug check ( no redirect here)
  /* db.get(
        "SELECT id, status FROM complaints WHERE id=?",
        [complaintId],
        (err, row) => {
          console.log('AFTER UPDATE FROM DB:', row);
          res.redirect('/admin'); // 👈 ONLY redirect
        }
      ); */
});

  



app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email=? OR regnum=?", [email, email], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.redirect('/login?error=Invalid credentials');
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' })  // secure:false for localhost
       .redirect(user.role === 'admin' ? '/admin' : '/complaint');
  });
});


app.listen(3000, () => console.log('Server at http://localhost:3000'));
