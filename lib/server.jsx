// meteor algorithm to check if this is a meteor serving http request or not
function IsAppUrl(req) {
  var url = req.url
  if(url === '/favicon.ico' || url === '/robots.txt') {
    return false;
  }

  // NOTE: app.manifest is not a web standard like favicon.ico and
  // robots.txt. It is a file name we have chosen to use for HTML5
  // appcache URLs. It is included here to prevent using an appcache
  // then removing it from poisoning an app permanently. Eventually,
  // once we have server side routing, this won't be needed as
  // unknown URLs with return a 404 automatically.
  if(url === '/app.manifest') {
    return false;
  }

  // Avoid serving app HTML for declared routes such as /sockjs/.
  if(RoutePolicy.classify(url)) {
    return false;
  }

  // we only need to support HTML pages only
  // this is a check to do it
  return /html/.test(req.headers['accept']);
}

ReactRouterSSR.Run = function(routes) {
  Meteor.publish('TestItems', function () {
    return TestItems.find();
  });

  const {Router} = ReactRouter;
  const Location = ReactRouter.lib.Location;
  const url = Npm.require('url');
  const Fiber = Npm.require('fibers');
  const cookieParser = Npm.require('cookie-parser');

  Meteor.bindEnvironment(function() {
    // Parse cookies for the login token
    WebApp.rawConnectHandlers.use(cookieParser());

    WebApp.rawConnectHandlers.use(Meteor.bindEnvironment(function(req, res, next) {
      if (!IsAppUrl(req)) {
        next();
        return;
      }

      var parsedUrl = url.parse(req.url, true);
      var location = new Location(parsedUrl.pathname, parsedUrl.query);

      Router.run(routes, location, function(error, initialState, transition) {
        var html = '';

        if (initialState) {
          var originalSubscribe = Meteor.subscribe;
          var subscriptions = [];

          var path = req.url;
          var loginToken = req.cookies['meteor_login_token'];
          var headers = req.headers;

          var context = new FastRender._Context(loginToken, { headers: headers });

          Meteor.subscribe = function() {
            context.subscribe.apply(context, arguments);
          };

          try {
            FastRender.frContext.withValue(context, function() {
              html = React.renderToString(
                <Router {...initialState} children={routes} />
              );
            });

            res.pushData('fast-render-data', context.getData());
          } catch(err) {
            console.error('error while server-rendering', err.stack);
          }

          Meteor.subscribe = originalSubscribe;
        }

        var originalWrite = res.write;
        res.write = function(data) {
          if(typeof data === 'string') {
            data = data.replace('<body>', '<body><div id="react-app">' + html + '</div>');
          }

          originalWrite.call(this, data);
        };

        next();
      });
    }));
  })();
};
