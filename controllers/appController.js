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

  const result = await global.mongodb.collection("mySessions").countDocuments({"session.username": user.username})

  if(result >= 4){
    req.session.error = "User already logged in 3 devices";
    return res.redirect("/login");
  }

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
