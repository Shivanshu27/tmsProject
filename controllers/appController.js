const bcrypt = require("bcryptjs");
const axios = require("axios");
const requestIp = require("request-ip");

exports.landing_page = (req, res) => {
  res.render("landing");
};

exports.login_get = (req, res) => {
  const error = req.session.error;
  delete req.session.error;
  res.render("login", { err: error });
};

// Function to get the user's location based on IP address
const getUserLocation = async (ipAddress) => {
  try {
    const response = await axios.get(`https://ipinfo.io/${ipAddress}/json`);
    const data = response.data;
    const location = data.city + ', ' + data.region;

    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    return 'Location Not Available';
  }
};

// Function to get user browser information using express-useragent
const getUserBrowserInfo = (req) => {
  const userAgent = req.useragent;
  // console.log(userAgent)

  const browser = userAgent.browser;
  const platform = userAgent.platform;
  const version = userAgent.version;

  return { browser, platform, version };
};


exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  const user = await global.mongodb.collection("users").findOne({ email });

  if (!user) {
    req.session.error = "Invalid Credentials";
    return res.redirect("/login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    req.session.error = "Invalid Credentials";
    return res.redirect("/login");
  }

  const result = await global.mongodb.collection("mySessions").findOne({})
  console.log("result", result);

  req.session.isAuth = true;
  req.session.username = user.username;
  req.session.createdDate = new Date(Date.now());
  req.session.ipAddress = requestIp.getClientIp(req); // Capture user's IP address
  // Get and store user location based on IP address
  const userLocation = await getUserLocation(requestIp.getClientIp(req));
  req.session.location = userLocation;

  // Get and store user browser information
  const userBrowserInfo = getUserBrowserInfo(req);
  req.session.browserInfo = userBrowserInfo;
  console.log(req.session.createdDate)
  res.redirect("/dashboard");
};

exports.register_get = (req, res) => {
  const error = req.session.error;
  delete req.session.error;
  res.render("register", { err: error });
};

exports.register_post = async (req, res) => {
  const { username, email, password } = req.body;

  let user = await global.mongodb.collection("users").findOne({ email });

  if (user) {
    req.session.error = "User already exists";
    return res.redirect("/register");
  }

  const hasdPsw = await bcrypt.hash(password, 12);


  await global.mongodb.collection("users").insertOne({
    username,
    email,
    password: hasdPsw,
  });
  res.redirect("/login");
};

exports.dashboard_get = async (req, res) => {

  const result = await global.mongodb.collection("mySessions").findOne({})
  // console.log("result", result);
  // const sessionID = req.session.id;
  const username = req.session.username;
  req.session.lastUsedDate = new Date(Date.now());

    res.render('dashboard', { name: username });
};

exports.logout_post = (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/login");
  });
};


// https://www.sohamkamani.com/nodejs/session-cookie-authentication/


// exports.login_post = async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });

//   if (!user) {
//     req.session.error = "Invalid Credentials";
//     return res.redirect("/login");
//   }

//   const isMatch = await bcrypt.compare(password, user.password);

//   if (!isMatch) {
//     req.session.error = "Invalid Credentials";
//     return res.redirect("/login");
//   }

//   // Get and store user browser information
//   const userBrowserInfo = getUserBrowserInfo(req);
  
//   // Find the user's previous session based on the user's ID
//   const previousSession = await MySession.findOne({ "session.username": user.username });
//   console.log("previousSession", previousSession)

//   if (previousSession) {
//     console.log("entered here 1111")
//     // Compare user's browser information with the previous session
//     if(previousSession.session.browserInfo){
//       if (
//         (userBrowserInfo.browser !== previousSession.session.browserInfo?.browser) ||
//         (userBrowserInfo.platform !== previousSession.session.browserInfo?.platform) ||
//         (userBrowserInfo.version !== previousSession.session.browserInfo?.version)
//       ) {
//         // User is logging in from a different device, create a new session
//         req.session.regenerate(async (err) => {
//           if (err) {
//             // Handle the error as needed
//             console.error('Error regenerating session:', err);
//             return res.redirect("/login");
//           } else {
//             console.log("entered here")
//             // Set the new session properties
//             req.session.isAuth = true;
//             req.session.username = user.username;
//             req.session.createdDate = new Date(Date.now());
//             req.session.ipAddress = req.ip; // Capture user's IP address
//             // Get and store user location based on IP address
//             const userLocation = await getUserLocation(req.ip);
//             req.session.location = userLocation;
        
//             // Store the new browser information
//             req.session.browserInfo = userBrowserInfo;
        
//             res.redirect("/dashboard");
//           }
//         });
//       }
//     }else {
//       console.log("entered here 2222")
//       // User's browser information matches the previous session, reuse the session
//       // req.session = previousSession.session;
//       req.session.isAuth = true;
//           req.session.username = user.username;
//           req.session.createdDate = new Date(Date.now());
//           req.session.ipAddress = req.ip; // Capture user's IP address
//       //     // Get and store user location based on IP address
//           const userLocation = await getUserLocation(req.ip);
//           req.session.location = userLocation;
      
//       //     // Store the new browser information
//           req.session.browserInfo = userBrowserInfo;
//       res.redirect("/dashboard");
//     }
//   } else {
//     // No previous session found, create a new session
//     console.log("entered here 3333")
//     req.session.isAuth = true;
//     req.session.username = user.username;
//     req.session.createdDate = new Date(Date.now());
//     req.session.ipAddress = req.ip; // Capture user's IP address
//     // Get and store user location based on IP address
//     const userLocation = await getUserLocation(req.ip);
//     req.session.location = userLocation;

//     // Store the new browser information
//     req.session.browserInfo = userBrowserInfo;

//     // Create a new MySession document for the user
//     // await MySession.create({
//     //   _id: user._id,
//     //   expires: req.session.cookie.expires,
//     //   session: req.session,
//     // });
//     res.redirect("/dashboard");
//   }

// };


 // const sessionToken = req.session.session_token;
  // // console.log("session", req.session);
  // console.log("sessionID", sessionID.toString());
  // console.log("session_info", req.session);
  // req.session.lastUsedDate = new Date(Date.now());

  // try {
  //   // Find the document by session ID
  //   // const mySession = await MySession.findOne({"_id": sessionID.toString()});
  //   const mySession = await MySession.findOne({});

  //   console.log(mySession)

  //   if (mySession) {
  //     // Update lastUsedDate to the current date
  //     mySession.session.lastUsedDate = new Date(Date.now());

  //     // Save the updated document
  //     await mySession.save();

  //     console.log(`Session with ID ${sessionID} updated`);
  //   } else {
  //     console.log(`Session with ID ${sessionID} not found`);
  //   }

    // res.render('dashboard', { name: username });
  // } catch (error) {
  //   console.error('Error updating session:', error);
  //   // Handle the error as needed
  // }