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
      store: new MongoStore({ mongooseConnection: mongoose.connection }),
    })
  );
  
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, ect...
app.use(flash());


//Connect to the database
mongoose.connect(process.env.DB_STRING, 
    {useNewUrlParser: true}, 
    () => (console.log(`Connected to database: ${mongoose.connection.name}`))
)


//get method
app.get('/', async (req, res) =>{
    try {
        MemwaQuestion.find({}, (err, questions) => {
            res.render('index.ejs', {
                user: req.user,
                memwaQuestions: questions
            })
        })
    } catch (err) {
       res.status(500).send({message: err.message})
    }
})

//post method= send to database
// app.post('/', async (req, res) => {
//     const memwaQuestion = new MemwaQuestion (
//         {
//             name: req.body.name,
//             tag: req.body.tag
//         }
//     )
//     try {
//         await memwaQuestion.save()
//         console.log(memwaQuestion)
//         res.redirect('/')
//     } catch(err) {
//         if (err) return res.status(500).send(err)
//         res.redirect('/')
//     }
// })

//post to send multiple questions to database
app.post('/', async (req, res) => {
  try {
    const questions = req.body.questions.split('\n'); // Split the bulk input into an array of individual questions
    const tag = req.body.tag;
    const category = req.body.category;
    const group = req.body.group;
    
    for (let i = 0; i < questions.length; i++) {
      const questionText = questions[i].trim();
      
      if (questionText) { // Skip empty lines
        const question = new MemwaQuestion({
          name: questionText,
          tag: tag,
          category: category,
          group: group,
        });
        
        await question.save(); // Save each question individually
        console.log(question)
      }
    }
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//new route for signup
app.get('/signup', authController.getSignup)
app.post("/signup", authController.postSignup);

//route for login
app.get("/login", authController.getLogin);
app.post("/login", authController.postLogin);

//route for logout
app.get("/logout", authController.logout);

//new route for profile page
app.get("/profile", ensureAuth, async (req, res) => {
    try {
      res.render("profile.ejs", {user: req.user});
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
                tag: req.body.tag,
                category: req.body.category,
                group: req.body.group
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
  //res.header('Access-Control-Allow-Origin', 'http://localhost:5174');
  // res.header('Access-Control-Allow-Origin', 'http://localhost:3131', 'http://localhost:5174', 'https://memwaappv2.onrender.com', 'https://mern-memwa.onrender.com');
    // res.header('Access-Control-Allow-Origin', 'https://memwaappv2.onrender.com');

   // Set the allowed origins in an array
   const allowedOrigins = [
    'http://localhost:3131',
    'http://localhost:5174',
    'https://memwaappv2.onrender.com',
    'https://mern-memwa.onrender.com',
  ];

    // Check if the request origin is in the allowed origins
    const requestOrigin = req.headers.origin;
    if (allowedOrigins.includes(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    }

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
        { tag: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i'}},
        // { group: { $regex: query, $options: 'i'}}
      ]
  }, (err, questions) => {
    if (err) return res.status(500).send(err);
    // console.log(questions);
    
    // Render the search results template with the matching questions
    res.render('searchResults', { questions: questions, query:query, user: req.user,});
  });
});

// ****** Route to get sorted questions
// app.get('/sort', async (req, res) => {
//   const sortBy = req.query.sortBy || 'tag'; // Default sort by category
//   const order = (sortBy === 'group' || sortBy === 'category') ? sortBy: 'tag';

//   try {
//       const questions = await MemwaQuestion.find().sort({ [order]: 1 }); // Sort ascending
//       console.log(questions); // Add this line to debug
//       res.render('sortResults', { sortBy:sortBy, questions: questions, user: req.user });
//   } catch (err) {
//       res.status(500).send(err.message);
//   }
// });

// ***update sort function to pull values from database and have drop down option
app.get('/sort', async (req, res) => {
  const sortBy = req.query.sortBy || 'tag';
  const searchValue = req.query.searchValue || '';
  let filter = {};

  // Fetch unique values for categories, groups, and tags
  const categories = await MemwaQuestion.distinct('category');
  const groups = await MemwaQuestion.distinct('group');
  const tags = await MemwaQuestion.distinct('tag');

  // Construct the filter based on the sortBy value
  if (sortBy === 'group') {
      filter.group = Number(searchValue);
  } else if (sortBy === 'tag') {
      filter.tag = { $regex: searchValue, $options: 'i' };
  } else {
      filter.category = { $regex: searchValue, $options: 'i' };
  }

  try {
      const questions = await MemwaQuestion.find(filter).sort({ [sortBy]: 1 });
      res.render('sortResults', { sortBy:sortBy, questions: questions, user: req.user, searchValue:searchValue, categories:categories, groups:groups, tags:tags });
  } catch (err) {
      res.status(500).send(err.message);
  }
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