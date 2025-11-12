const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer'); // ✅ new

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: true,
}));

// Setup Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ storage });

// JSON File path
const dataPath = path.join(__dirname, 'data', 'places.json');

function loadPlaces() {
  if (!fs.existsSync(dataPath)) return [];
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
}
function savePlaces(places) {
  fs.writeFileSync(dataPath, JSON.stringify(places, null, 2));
}

// Middleware to require login
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) next();
  else res.redirect('/login');
}

// Routes

// Home page
app.get('/', (req, res) => {
  const places = loadPlaces();
  res.render('index', { places });
});

// Login routes
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'login.html')));
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '12345') {
    req.session.loggedIn = true;
    res.redirect('/admin/dashboard');
  } else {
    res.send('<h3>❌ Invalid credentials. <a href="/login">Try again</a></h3>');
  }
});
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Admin dashboard
app.get('/admin/dashboard', requireLogin, (req, res) => {
  const places = loadPlaces();
  res.render('admin-dashboard', { places });
});

// Add form
app.get('/admin/add-form', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'add-place.html'));
});

// ✅ Add place with image upload
app.post('/admin/add', requireLogin, upload.single('image'), (req, res) => {
  const { name, description, themeColor } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

  const places = loadPlaces();
  places.push({ name, description, themeColor, image: imagePath });
  savePlaces(places);

  res.redirect('/admin/dashboard');
});

// Edit form
app.get('/admin/edit/:index', requireLogin, (req, res) => {
  const places = loadPlaces();
  const place = places[req.params.index];
  if (!place) return res.send('<h3>Place not found</h3>');

  res.send(`
    <h1>Edit Place</h1>
    <form action="/admin/edit/${req.params.index}" method="POST" enctype="multipart/form-data">
      <input type="text" name="name" value="${place.name}" required><br>
      <textarea name="description" required>${place.description}</textarea><br>
      <input type="color" name="themeColor" value="${place.themeColor}" required><br>
      <p>Current image:</p>
      <img src="${place.image}" width="150"><br>
      <input type="file" name="image" accept="image/*"><br>
      <button type="submit">Save Changes</button>
    </form>
    <br><a href="/admin/dashboard">Back</a>
  `);
});

// ✅ Edit route with image update
app.post('/admin/edit/:index', requireLogin, upload.single('image'), (req, res) => {
  const { name, description, themeColor } = req.body;
  const index = req.params.index;
  const places = loadPlaces();

  if (places[index]) {
    const place = places[index];
    const newImage = req.file ? `/uploads/${req.file.filename}` : place.image;
    places[index] = { name, description, themeColor, image: newImage };
    savePlaces(places);
  }

  res.redirect('/admin/dashboard');
});

// Delete
app.get('/admin/delete/:index', requireLogin, (req, res) => {
  const places = loadPlaces();
  places.splice(req.params.index, 1);
  savePlaces(places);
  res.redirect('/admin/dashboard');
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
