const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const useragent = require('express-useragent');
const {connectMongo} = require("./config/mongo")


const appController = require("./controllers/appController");
const isAuth = require("./middleware/is-auth");
const app = express();

connectMongo()
  .then(()=>{
    // connectDB();
    app.use(useragent.express());
    
    const store = new MongoDBStore({
      uri: "mongodb://localhost:27017",
      collection: "mySessions",
    });
    
    app.set("view engine", "ejs");
    app.use(express.urlencoded({ extended: true }));
    
    app.use(
      session({
        secret: "secret",
        resave: false,
        saveUninitialized: false,
        store: store,
        cookie: {
          maxAge: 5 * 1000, // 2 hours in milliseconds
        },
      })
    );
    
    //=================== Routes
    // Landing Page
    app.get("/", appController.landing_page);
    
    // Login Page
    app.get("/login", appController.login_get);
    app.post("/login", appController.login_post);
    
    // Register Page
    app.get("/register", appController.register_get);
    app.post("/register", appController.register_post);
    
    // Dashboard Page
    app.get("/dashboard", isAuth, appController.dashboard_get);
    
    app.post("/logout", appController.logout_post);
    
    app.listen(5000, console.log("App Running on http://localhost:5000"));
  })
  .catch(console.error)
  
