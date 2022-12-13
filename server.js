if(process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}




const express = require("express")
const app = express()
let Article = require('./views/articles');
const bcrypt = require("bcrypt") 
const initializePassport = require("./passport-config")
const passport = require("passport")
const flash = require("express-flash")
const session = require("express-session")
const methodOverride = require("method-override")
const mongoose = require('mongoose');
const bodyParser = require("body-parser");


mongoose.connect('mongodb://localhost/nodekb')
let db = mongoose.connection;
//check for db errors
db.on('error',function(err){
    console.log(err);
});
//connection
db.once('open', function(){
    console.log('Connected to MongoDb');


});
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());




initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
   
)

const users = []
app.set('view-engine','ejs')

app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, // We wont resave the session variable if nothing is changed
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride("_method"))


app.post("/login", checkNotAuthenicated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true


}))

app.use('/public',express.static(__dirname + '/public'));

app.get('/', checkAuthenicated,(req,res) => {
    res.render("index.ejs", {name: req.user.name})
})
//connects ejs to node js
app.get('/information',(req,res) => {
    res.render('information.ejs')
})
app.get('/createarticle',(req,res) => {
    res.render('createarticle.ejs')
})
app.get("/article/:id",(req,res,) => {
    var id = req.params.id;
    Article.findById(id,function(err,article){
        res.render('article.ejs', {
            article: article
        });
    });
    
});
app.get('/newarticle',(req,res) => {
    Article.find({},function(err,articles){
        if(err){
            console.log(err);
        }
        else{
        res.render('newarticle.ejs', {
            title: 'Articles',
            articles: articles
        });
    }
    });
    
});
app.post('/createarticle',(req,res) => {
    let article = new Article();
    article.title= req.body.title;
    article.author = req.body.author;
    article.body = req.body.body;
    console.log(article.author);

    article.save(function(err){
        if(err){
            console.log(err);
            return;
        } else {
           res.redirect('/newarticle') 
        }
    })
});

app.get("/article/edit/:id",(req,res,) => {
    var id = req.params.id;
    Article.findById(id,function(err,article){
        res.render('edit_article.ejs', {
            title:'Edit Article',
            article: article
        });
    });
    
});

app.post("/article/edit/:id",(req,res) => {
    let article = {};
    article.title= req.body.title;
    article.author = req.body.author;
    article.body = req.body.body;
    let query = {_id:req.params.id}

    Article.update(query,article,function(err){
        if(err){
            console.log(err);
            return;
        } else {
           res.redirect('/newarticle') 
        }
    });
});
app.get('/delete/:id', function (req, res, next) {
    Article.findByIdAndRemove(req.params.id, (err, article) => {
      if (!err) {
        res.redirect('/newarticle')
      } else {
        console.log(err)
      }
    });
  });

app.get('/login',checkNotAuthenicated,(req,res) => {
    res.render('login.ejs')
})
app.get('/register', checkNotAuthenicated,(req,res) =>{
    res.render('register.ejs')
})



app.delete("/logout", (req, res) => {
    req.logout(req.user, err => {
        if (err) return next(err)
        res.redirect("/")
    })
})
function checkAuthenicated(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect("/login")
}
function checkNotAuthenicated(req,res,next){
    if(req.isAuthenticated()){
        return res.redirect("/")
    }
    next()
}
app.post("/register",checkNotAuthenicated, async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(), 
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        })
        console.log(users); // Display newly registered in the console
        res.redirect("/login")
        
    } catch (e) {
        console.log(e);
        res.redirect("/register")
    }
})
console.log(users);
app.listen(3000)
