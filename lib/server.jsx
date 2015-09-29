var _MongoCollectionProxy;

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
  return true;
}

const {Router} = ReactRouter;
const url = Npm.require('url');
const Fiber = Npm.require('fibers');
const cookieParser = Npm.require('cookie-parser');

ReactRouterSSR.Run = function(routes, clientOptions, serverOptions) {
  if (!clientOptions) {
    clientOptions = {};
  }

  if (!serverOptions) {
    serverOptions = {};
  }

  Meteor.bindEnvironment(function() {
    // Parse cookies for the login token
    WebApp.rawConnectHandlers.use(cookieParser());

    WebApp.connectHandlers.use(Meteor.bindEnvironment(function(req, res, next) {
      if (!IsAppUrl(req)) {
        next();
        return;
      }

      const history = ReactRouter.history.createMemoryHistory(req.url);

      var path = req.url;
      var loginToken = req.cookies['meteor_login_token'];
      var headers = req.headers;

      var css = null;

      var context = new FastRender._Context(loginToken, { headers: headers });

      try {
        FastRender.frContext.withValue(context, function() {
          const originalSubscribe = Meteor.subscribe;

          Meteor.subscribe = function(name) {
            if (Package.mongo && !Package.autopublish) {
              _MongoCollectionProxy.isSSR = false;
              const publishResult = Meteor.server.publish_handlers[name].call(context);
              _MongoCollectionProxy.isSSR = true;

              _MongoCollectionProxy._fakePublish(publishResult);
            }

            context.subscribe.apply(context, arguments);
          };

          if (Package.mongo) {
            _MongoCollectionProxy.isSSR = true;
          }

          if (serverOptions.preRender) {
            serverOptions.preRender(req, res);
          }

          global.__STYLE_COLLECTOR_MODULES__ = [];
          global.__STYLE_COLLECTOR__ = '';

          html = React.renderToString(
            <Router
              history={history}
              children={routes}
              {...serverOptions.props} />
          );

          css = global.__STYLE_COLLECTOR__;

          if (serverOptions.postRender) {
            serverOptions.postRender(req, res);
          }

          Meteor.subscribe = originalSubscribe;

          if (Package.mongo) {
            _MongoCollectionProxy.isSSR = false;
          }
        });

        res.pushData('fast-render-data', context.getData());
      } catch(err) {
        console.error('error while server-rendering', err.stack);
      }

      var originalWrite = res.write;
      res.write = function(data) {
        if(typeof data === 'string' && data.indexOf('<!DOCTYPE html>') === 0) {
          if (!serverOptions.dontMoveScripts) {
            data = moveScripts(data);
          }

          if (css) {
            data = data.replace('</head>', '<style id="' + (clientOptions.styleCollectorId || 'css-style-collector-data') + '">' + css + '</style></head>');
          }

          data = data.replace('<body>', '<body><div id="' + (clientOptions.rootElement || 'react-app') + '">' + html + '</div>');
        }

        originalWrite.call(this, data);
      };

      next();
    }));
  })();
};

// Thank you FlowRouter for this wonderful idea :)
// https://github.com/kadirahq/flow-router/blob/ssr/server/route.js
const Cheerio = Npm.require('cheerio');

function moveScripts(data) {
  const $ = Cheerio.load(data, {
    decodeEntities: false
  });
  const heads = $('head script');
  $('body').append(heads);

  // Remove empty lines caused by removing scripts
  $('head').html($('head').html().replace(/(^[ \t]*\n)/gm, ''));

  return $.html();
}

if (Package.mongo && !Package.autopublish) {
  // Protect against returning data that has not been published
  class MongoCollectionProxy extends Mongo.Collection {
    constructor(name, options) {
      super(name, options);
      this._name = name;
    }

    find() {
      if (!MongoCollectionProxy.isSSR) {
        return super.find.apply(this, arguments);
      }

      // Make sure to return nothing if no publish has been called
      if (!MongoCollectionProxy._selectors[this._name] || !MongoCollectionProxy._selectors[this._name].length) {
        return super.find({ _id: -1 });
      }

      let args = Array.prototype.slice.call(arguments);

      if (args.length) {
        args[0] = { $and: [args[0], { $or: MongoCollectionProxy._selectors[this._name] }] };
      } else {
        args.push({ $or: MongoCollectionProxy._selectors[this._name] });
      }

      return super.find.apply(this, args);
    }

    findOne() {
      if (!MongoCollectionProxy.isSSR) {
        return super.findOne.apply(this, arguments);
      }

      // Make sure to return nothing if no publish has been called
      if (!MongoCollectionProxy._selectors[_name] || !MongoCollectionProxy._selectors[this._name].length) {
        return super.findOne({ _id: -1 });
      }

      let args = Array.prototype.slice.call(arguments);

      if (args.length) {
        if (typeof args[0] === 'string') {
          args[0] = { _id: args[0] };
        }

        args[0] = { $and: [args[0], { $or: MongoCollectionProxy._selectors[this._name] }] };
      } else {
        args.push({ $or: MongoCollectionProxy._selectors[this._name] });
      }

      return super.findOne.apply(this, args);
    }
  }

  MongoCollectionProxy._selectors = {};

  MongoCollectionProxy._fakePublish = function(result) {
    if (Array.isArray(result)) {
      result.forEach(subResult => MongoCollectionProxy._fakePublish(subResult));
      return;
    }

    const name = result._cursorDescription.collectionName;
    const selector = result._cursorDescription.selector;

    if (!MongoCollectionProxy._selectors[name]) {
      MongoCollectionProxy._selectors[name] = [];
    }

    MongoCollectionProxy._selectors[name].push(selector);
  };

  Mongo.Collection = MongoCollectionProxy;
  _MongoCollectionProxy = MongoCollectionProxy;
}
