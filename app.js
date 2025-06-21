if(process.env.NODE_ENV != "production"){
    require('dotenv').config()
}


const express = require("express");
const mongoose = require("mongoose");
const methodOverRide = require("method-override");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");

const  sendEmail = require("./sendEmail.js");
const crypto = require("crypto");
const User = require("./models/user");

const path = require("path");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const multer  = require('multer')
const {storage} = require("./cloudConfig.js");
const upload = multer({storage });
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const {userSchema} = require("./schema.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

const app = express();
const PORT = 4001;

const MONGO_URL = process.env.MONGO_URL;
const secretCode = process.env.SECRET;


app.listen(PORT , () => {
    console.log(`Server is listening to port number ${PORT}`);
})


const store = MongoStore.create({
    mongoUrl : MONGO_URL,
    crypto : {
        secret : secretCode
    },
    touchAfter : 24 * 60 * 60,
});

store.on("error" ,() => {
    console.log("ERROR in MONGO SESSSION STORE" , error)
})

const sessionOptions = {
    store,
    secret : secretCode,
    resave: false,
    saveUninitialized: true,
    cookie : {
        expire : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    }
}

app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname , "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverRide("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

main()
.then( () => {
    console.log("Connection Successfull");
})
.catch((err) => {
    console.log(err);
})
async function main() {
    await mongoose.connect(MONGO_URL);
}

const validateUser = (req, res , next) => {
    let {error} =  userSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400 , errMsg);
    }else{
        next();
    }
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success  = req.flash("success");
    res.locals.error  = req.flash("error");
    res.locals.user = req.user;
    next();
});

app.get('/' , (req , res) => {
    res.render("user/index.ejs");
})

app.get("/index" , (req , res) => {
    res.render("user/index.ejs");
})


// User Login And Register Process
app.get("/register" , (req , res) => {
    res.render("user/signup.ejs");
})

app.get("/login" , (req , res) => {
    res.render("user/login.ejs");
})

//Goolge Authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find user or create new
      let existingUser = await User.findOne({ googleId: profile.id });

      if (!existingUser) {
        existingUser = new User({
          googleId: profile.id,
          name: profile.displayName || "No Name",
          username: `google_${profile.id}`,
          email: profile.emails[0].value,
          profilePicture: {
            url: profile.photos[0].value,
            filename: "google-oauth"
          }
        });
        await existingUser.save();
      }

      return done(null, existingUser);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Add these routes below your existing routes:
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Handle callback from Google
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    req.flash("success", `Hello ${req.user.username}, Welcome via Google!`);
    res.redirect('/index');
  }
);

app.post("/register" , upload.single('user[profilePicture]') , validateUser , wrapAsync (async(req , res , next) => {
   try{
    let url = req.file.path;
    let filename = req.file.filename;
    let password = req.body.password;
    let user = req.body.user;

     // Check if email already exists
        const existingUser = await User.findOne({ email: user.email });
        if (existingUser) {
            req.flash("error", "Email is already registered. Please use a different email or login.");
            return res.redirect("/register");
        }

    let newUser = new User(user);
    newUser.profilePicture = {url , filename};
    const registeredUser = await User.register(newUser , password);

    await sendEmail(
      registeredUser.email, // recipient
      "Welcome to User Registration System",
      `<h2>Hello ${registeredUser.name || registeredUser.username},</h2>
       <p>Welcome to our platform! Your registration was successful.</p>`
    );

    req.login(registeredUser , (err) => {
        if(err){
            return next(err);
        }
        req.flash("success" , "Welcome To  User Registration!");
        res.redirect("/index");
    })
   }catch(err){
       req.flash("error" , err.message);
       res.redirect("/register");
   }

 }));

app.post("/login" ,passport.authenticate("local" ,{
    failureRedirect : '/index' , failureFlash : true}) ,
    async (req , res) => {
    let name = req.user.name;
    req.flash("success" , `Hello ${name} , Welcome Back to User Registration System`);    app.post("/register", upload.single('user[profilePicture]'), wrapAsync(async (req, res, next) => {
       try {
        let url = req.file.path;
        let filename = req.file.filename;
        let password = req.body.password;
        let user = req.body.user;
        let newUser = new User(user);
        newUser.profilePicture = { url, filename };
        const registeredUser = await User.register(newUser, password);
    
        // Send welcome email
        await sendEmail(
          registeredUser.email, // recipient
          "Welcome to User Registration System",
          `<h2>Hello ${registeredUser.name || registeredUser.username},</h2>
           <p>Welcome to our platform! Your registration was successful.</p>`
        );
    
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome To User Registration!");
            res.redirect("/index");
        });
       } catch (err) {
           req.flash("error", err.message);
           res.redirect("/register");
       }
    }));
    res.redirect("/index");
})

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.flash("success" , "Your are successfully logged out!");
      res.redirect('/index');
    });
});

//Forgot PAssword Functionality
app.get("/forgot-password", (req, res) => {
  res.render("user/forgot-password.ejs");
});

//Route to Handle Email Submission
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "No user with that email.");
    return res.redirect("/forgot-password");
  }

  // Generate token
  const token = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send email
  const resetURL = `http://${req.headers.host}/reset-password/${token}`;
  await sendEmail(
    user.email,
    "Reset Your Password",
    `<p>Click <a href="${resetURL}">here</a> to reset your password. This link expires in 1 hour.</p>`
  );

  req.flash("success", "Password reset link sent to your email.");
  res.redirect("/login");
});

//Route to Show Reset Form
app.get("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired.");
    return res.redirect("/forgot-password");
  }

  res.render("user/reset-password.ejs", { token: req.params.token });
});

app.post("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Token expired or invalid.");
    return res.redirect("/forgot-password");
  }

  const { password } = req.body;
  await user.setPassword(password); // passport-local-mongoose method
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  req.login(user, (err) => {
    if (err) return next(err);
    req.flash("success", "Password has been reset successfully!");
    res.redirect("/index");
  });
});

//Login Using OTP
app.get('/login-otp', (req, res) => {
  res.render('user/login-otp.ejs');
});

app.get('/verify-otp', (req, res) => {
  res.render('user/verify-otp.ejs', { email: req.query.email });
});

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "Email not found");
    return res.redirect('/login-otp');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000; // valid for 5 minutes
  await user.save();

  await sendEmail(
    user.email,
    "Your OTP for Login",
    `<p>Your login OTP is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`
  );

  req.flash("success", "OTP sent to your email.");
  res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
});

app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
    req.flash("error", "Invalid or expired OTP.");
    return res.redirect('/login-otp');
  }

  // Clear OTP after successful login
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  req.login(user, (err) => {
    if (err) return next(err);
    req.flash("success", `Welcome back, ${user.name}!`);
    res.redirect("/index");
  });
});


// Error Handing Middlwwares
// app.all("*" , (req , res , next) => {
//     next(new ExpressError(404 , "Page Not Found!"));
// }) 

// app.use((err , req , res , next) => {
//     let{statusCode = 500 , message = "Something Went Wrong!"} = err;
//     res.status(statusCode).render("error.ejs" , {message});
//  })

