//Declare the variables
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const MemwaQuestion = require('./models/questions')
require('dotenv').config()

//Set the middleware
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))

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
                memwaQuestions: questions
            })
        })
    } catch (err) {
       res.status(500).send({message: err.message})
    }
})

//post method= send to database
app.post('/', async (req, res) => {
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
// Create a new route for getting a list of questions
app.get('/api/questions', (req, res) => {
  // Get all the questions from the database
  const questions = db.getAllQuestions();

  // Return the questions to the client
  res.json(questions);
});

// Create a new route for adding a question
app.post('/api/questions', (req, res) => {
  // Get the question from the request body
  const question = req.body;

  // Add the question to the database
  db.addQuestion(question);

  // Return the question to the client
  res.json(question);
});

// Create a new route for deleting a question
app.delete('/api/questions/:questionID', (req, res) => {
  // Get the question ID from the request path
  const questionID = req.params.questionID;

  // Delete the question from the database
  db.deleteQuestion(questionID);

  // Return a success message to the client
  res.json({ success: true });
});

// Create a new route for submitting an answer
app.post('/api/answers', (req, res) => {
  // Get the question ID and answer from the request body
  const questionID = req.body.questionID;
  const answer = req.body.answer;

  // Save the answer to the database
  db.saveAnswer(questionID, answer);

  // Return a success message to the client
  res.json({ success: true });
});


// **************************** testing api function***********
// Create a new route for the questions page
app.get('/questions', (req, res) => {
  // Get the user's profile from the database
//   const user = db.getUser(req.session.userID);

  // Render the questions page with the user's questions
  res.render('questions', {
    // user: user,
    MemwaQuestions: questions
  });
});

// Create a new route for the answer page
app.get('/answer/:questionID', (req, res) => {
  // Get the question from the database
  const question = db.getQuestion(req.params.questionID);

  // Render the answer page with the question
  res.render('answer', {
    question: question
  });
});
// Create a new route for submitting an answer
app.post('/answer', (req, res) => {
  // Get the question from the database
  const question = db.getQuestion(req.body.questionID);

  // Save the user's response to the database
  db.saveAnswer(req.body.questionID, req.body.response);

  // Redirect the user back to the questions page
  res.redirect('/questions');
});


// ********************************** end of code testing

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

//Set port to initialize our server
app.listen(process.env.PORT || PORT, () =>{
    console.log(`Server is running on port ${process.env.PORT}`)
})