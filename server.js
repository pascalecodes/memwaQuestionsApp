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
    res.header('Access-Control-Allow-Origin', 'http://localhost:8130');
    res.json(questions)
})


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