
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var RedisStore = require('connect-redis')(express);
var connectDomain = require('connect-domain');
var fs = require('fs');
var helmet = require('helmet');
var BtcWallet = environment === "test" ? require("./tests/helpers/btc_wallet_mock") : require("./lib/btc_wallet");
var LtcWallet = environment === "test" ? require("./tests/helpers/ltc_wallet_mock") : require("./lib/ltc_wallet");
var PpcWallet = environment === "test" ? require("./tests/helpers/ppc_wallet_mock") : require("./lib/ppc_wallet");
var environment = process.env.NODE_ENV || 'development';
var config = JSON.parse(fs.readFileSync(process.cwd() + '/config.json', encoding='utf8'))[environment];

// Configure globals
GLOBAL.passport = require('passport');
GLOBAL.appConfig = function () {return config;};
GLOBAL.wallets = []
GLOBAL.wallets["BTC"] = new BtcWallet();
GLOBAL.wallets["LTC"] = new LtcWallet();
GLOBAL.wallets["PPC"] = new PpcWallet();
GLOBAL.db = require('./models/index');

require('./lib/admin_auth');


// Setup express
var app = express();
if (environment !== 'development') {
  app.use(connectDomain());
}
var connectAssetsOptions = environment !== 'development' ? {minifyBuilds: true} : {};
connectAssetsOptions.helperContext = app.locals
app.enable("trust proxy");
app.disable('x-powered-by');
app.configure(function () {
  app.set('port', process.env.PORT || 6983);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'coinnextsecretadmin83',
    store: new RedisStore(GLOBAL.appConfig().redis),
    cookie: {
      maxAge: 2592000000,
      path: '/'
    }
  }));
  if (environment !== "test") {
    app.use(express.csrf());
    app.use(function(req, res, next) {
      res.locals.csrfToken = req.csrfToken();
      next();
    });
    app.use(helmet.xframe('sameorigin'));
  }
  app.use(express.static(__dirname + '/public'));
  app.use(require('connect-assets')(connectAssetsOptions));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(function(err, req, res, next) {
    console.error(err);
    res.send(500, "Oups, seems that there is an error on our side. Your coins are safe and we'll be back shortly...");
  });
});


// Configuration

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log("Coinnext admin is running on port %d in %s mode", app.get("port"), app.settings.env);
});


//User validation
if (GLOBAL.appConfig().admin_auth) {
  var auth = function (req, res, next) {
    if ((req.query.u === GLOBAL.appConfig().admin_auth.user) && (req.query.p === GLOBAL.appConfig().admin_auth.pass)) {
      req.session.admin_auth = true;
    }
    if (!req.session.admin_auth) return res.redirect("http://www.youtube.com/watch?v=oHg5SJYRHA0");
    next();
  }
  app.get('*', auth);
}


// Routes
require('./routes/admin')(app);