const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");


const axios = require("axios");
const cheerio = require("cheerio");


const db = require("./models");

const PORT = process.env.PORT || 8080;


const app = express();

// Configure middleware

app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// // Make public a static folder
app.use(express.static("public"));

// var exphbs = require("express-handlebars");

// app.engine("handlebars", exphbs({ defaultLayout: "main" }));
// app.set("view engine", "handlebars");
// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/ArticleScraping", { useNewUrlParser: true, useCreateIndex: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/", (req, res) => {
    // First, we grab the body of the html with axios
    axios.get("https://alistapart.com/").then(response => {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        const $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $("article").each(function (i, element) {
            // Save an empty result object
            const result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(element)
                .children()
                .text();
            result.link = $(element)
                .find("a")
                .attr("href");

            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(dbArticle => {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(err => {
                    // If an error occurred, log it
                    console.log(err);
                });
        });


    });
    
});

// Route for getting all Articles from the db
app.get("/articles", (req, res) => {
    // TODO: Finish the route so it grabs all of the articles
    db.Article.find({})
        .then(dbArticle => {
            
            // var hbsObject = {
            //     title: title,
            //     link: link
            // };
            // console.log(hbsObject);
            // res.render("index", hbsObject);
            res.json(dbArticle);
        }).catch(err => {
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", (req, res) => {

    db.Article
        .findOne({ _id: req.params.id })
        .populate("note")
        .then(dbArticle => {
            res.json(dbArticle);
        }).catch(err => {
            res.json(err);
        });
    // and run the populate method with "note",
    // then responds with the article with the note included
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", (req, res) => {

    db.Note.create(req.body)
        .then(dbNote => {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        }).then(dbArticle => {
            res.json(dbArticle);
        }).catch(err => {
            res.json(err);
        });
});

// Listen on port 3000
app.listen(PORT, () => {
    console.log(`App running on port http://localhost:${PORT}`);
});

