ReactRouterSSR.Run = function(routes) {
  Meteor.publish('TestItems', function () {
    return TestItems.find();
  });

  const {Router} = ReactRouter;
  const Location = ReactRouter.lib.Location;
  const url = Npm.require('url');
  const Fiber = Npm.require('fibers');

  Meteor.bindEnvironment(function() {
    WebApp.rawConnectHandlers.use(Meteor.bindEnvironment(function(req, res, next) {
      if (req.url !== '/') {
        next();
        return;
      }

      var parsedUrl = url.parse(req.url);
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
      });

      next();
    }));
  })();
};
