//Declare the variables
const express = require("express")
const app = express()
const mongoose = require('mongoose')
const passport = require("passport");
const session = require("express-session");
const cors = require('cors')
const authController = require("./controller/auth");

const MongoStore = require("connect-mongo")(session);
const flash = require("express-flash");
const methodOverride = require("method-override");
const connectDB = require("./config/database");
const MemwaQuestion = require('./models/questions')
const { ensureAuth, ensureGuest } = require("./middleware/auth");
//require('dotenv').config()

require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

//Connect To Database
connectDB();

//Set the middleware
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.use(express.json());

//Use forms for put / delete
app.use(methodOverride("_method"));

// Setup Sessions - stored in MongoDB
app.use(
    session({
      secret: "keyboard cat",
      resave: false,
      saveUninitialized: false,
      //store: new MongoStore({ mongooseConnection: mongoose.connection }),
    })
  );
  
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());



//Connect to the database
mongoose.connect(process.env.DB_STRING, 
    {useNewUrlParser: true}, 
    () => (console.log(`Connected to database: ${mongoose.connection.name}`))
)


//get method
app.get('/', ensureGuest, async (req, res) =>{
    try {
        MemwaQuestion.find({}, (err, questions) => {
            res.render('index.ejs', {
                memwaQuestions: questions
            })
        })
    } catch (err) {
       res.status(500).send({message: err.message})
    }
})

//post method= send to database
app.post('/', ensureAuth, async (req, res) => {
    const memwaQuestion = new MemwaQuestion (
        {
            name: req.body.name,
            tag: req.body.tag
        }
    )
    try {
        await memwaQuestion.save()
        console.log(memwaQuestion)
        res.redirect('/')
    } catch(err) {
        if (err) return res.status(500).send(err)
        res.redirect('/')
    }
})

//new route for signup
app.get('/signup', authController.getSignup)
app.post("/signup", authController.postSignup);

//route for login
app.get("/login", authController.getLogin);
app.post("/login", authController.postLogin);

//new route for profile page
app.get("/profile", ensureAuth, async (req, res) => {
    try {
      res.render("profile.ejs");
    } catch (err) {
      console.log(err);
      res.render('error/500')
    }
  })

//update or edit method
app
    .route("/edit/:id")
    .get((req, res) => {
        const id = req.params.id;
        MemwaQuestion.find({}, (err, questions) => {
            res.render("edit.ejs", { memwaQuestions: questions, idQuestion: id });
        });
    })
    .post((req, res) => {
        const id = req.params.id;
        MemwaQuestion.findByIdAndUpdate(
            id,
            {
                name: req.body.name,
                tag: req.body.tag
            },

            err => {
                if (err) return res.status(500).send(err);
                res.redirect("/");
            });
    });

//delete method
app
    .route('/remove/:id')
    .get((req, res) => {
        const id = req.params.id
        MemwaQuestion.findByIdAndRemove(id, err =>{
            if (err) return res.status(500).send(err);
            res.redirect("/");
        })
    })

//new route for getting questions
app.get('/questions', async(req, res)=> {
    const questions = await MemwaQuestion.find()
    res.header('Access-Control-Allow-Origin', 'http://localhost:3131');
    res.json(questions)
})

//search question
app.get('/search', async(req, res) => {
  const query = req.query.query;
  let questions
  
  // Perform the search based on the query
//   MemwaQuestion.find({$or: { name: { $regex: query, $options: 'i' }}, {tag: {$regex: query, $options: 'i'}}},(err, questions) => {
//     if (err) return res.status(500).send(err);
//     console.log(questions)
    
//     // Render the search results template with the matching questions
//     res.render('searchResults', { questions: questions });
//   });

  MemwaQuestion.find({
    $or: [
        { name: { $regex: query, $options: 'i' } },
        { tag: { $regex: query, $options: 'i' } }
      ]
  }, (err, questions) => {
    if (err) return res.status(500).send(err);
    // console.log(questions);
    
    // Render the search results template with the matching questions
    res.render('searchResults', { questions: questions, query:query });
  });
});


//check to see if the question has already been called from the database
app.get('/questions/:id/pulled', async (req, res) => {
    const id = req.params.id
    const question = await MemwaQuestion.findById(id)
    const pulled = question.pulled
    res.json({ pulled })
})

//Set port to initialize our server
app.listen(process.env.PORT || PORT, () =>{
    console.log(`Server is running on port ${process.env.PORT}`)
})