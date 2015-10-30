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

let webpackStats;

ReactRouterSSR.LoadWebpackStats = function(stats) {
  webpackStats = stats;
}

ReactRouterSSR.Run = function(routes, clientOptions, serverOptions) {
  if (!clientOptions) {
    clientOptions = {};
  }

  if (!serverOptions) {
    serverOptions = {};
  }

  if (!serverOptions.webpackStats) {
    serverOptions.webpackStats = webpackStats;
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

          Meteor.subscribe = function(name, ...args) {
            if (Package.mongo && !Package.autopublish) {
              Mongo.Collection._isSSR = false;
              const publishResult = Meteor.server.publish_handlers[name].apply(context, args);
              Mongo.Collection._isSSR = true;

              Mongo.Collection._fakePublish(publishResult);
            }

            context.subscribe.apply(context, arguments);
          };

          if (Package.mongo && !Package.autopublish) {
            Mongo.Collection._isSSR = true;
            Mongo.Collection._publishSelectorsSSR = {};
          }

          if (serverOptions.preRender) {
            serverOptions.preRender(req, res);
          }

          global.__STYLE_COLLECTOR_MODULES__ = [];
          global.__STYLE_COLLECTOR__ = '';
          global.__CHUNK_COLLECTOR__ = [];

          html = ReactDOMServer.renderToString(
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

          if (Package.mongo && !Package.autopublish) {
            Mongo.Collection._isSSR = false;
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

          if (typeof serverOptions.webpackStats !== 'undefined') {
            const chunkNames = serverOptions.webpackStats.assetsByChunkName;
            const publicPath = serverOptions.webpackStats.publicPath;

            if (typeof chunkNames.common !== 'undefined') {
              var chunkSrc = (typeof chunkNames.common === 'string')?
                chunkNames.common :
                chunkNames.common[0];

              data = data.replace('<head>', '<head><script type="text/javascript" src="' + publicPath + chunkSrc + '"></script>');
            }

            for (var i = 0; i < global.__CHUNK_COLLECTOR__.length; ++i) {
              if (typeof chunkNames[global.__CHUNK_COLLECTOR__[i]] !== 'undefined') {
                var chunkSrc = (typeof chunkNames[global.__CHUNK_COLLECTOR__[i]] === 'string')?
                  chunkNames[global.__CHUNK_COLLECTOR__[i]] :
                  chunkNames[global.__CHUNK_COLLECTOR__[i]][0];

                data = data.replace('</head>', '<script type="text/javascript" src="' + publicPath + chunkSrc + '"></script></head>');
              }
            }
          }
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
  const originalFind = Mongo.Collection.prototype.find;
  const originalFindOne = Mongo.Collection.prototype.findOne;

  Mongo.Collection.prototype.findOne = function() {
    let args = Array.prototype.slice.call(arguments);

    if (!Mongo.Collection._isSSR) {
      return originalFindOne.apply(this, args);
    }

    // Make sure to return nothing if no publish has been called
    if (!Mongo.Collection._publishSelectorsSSR[this._name] || !Mongo.Collection._publishSelectorsSSR[this._name].length) {
      return originalFindOne(undefined);
    }

    if (args.length) {
      if (typeof args[0] === 'string') {
        args[0] = { _id: args[0] };
      }

      args[0] = { $and: [args[0], { $or: Mongo.Collection._publishSelectorsSSR[this._name] }] };
    } else {
      args.push({ $or: Mongo.Collection._publishSelectorsSSR[this._name] });
    }

    return originalFindOne.apply(this, args);
  };

  Mongo.Collection.prototype.find = function() {
    let args = Array.prototype.slice.call(arguments);

    if (!Mongo.Collection._isSSR) {
      return originalFind.apply(this, args);
    }

    // Make sure to return nothing if no publish has been called
    if (!Mongo.Collection._publishSelectorsSSR[this._name] || !Mongo.Collection._publishSelectorsSSR[this._name].length) {
      return originalFind(undefined);
    }

    if (args.length) {
      args[0] = { $and: [args[0], { $or: Mongo.Collection._publishSelectorsSSR[this._name] }] };
    } else {
      args.push({ $or: Mongo.Collection._publishSelectorsSSR[this._name] });
    }

    return originalFind.apply(this, args);
  };

  Mongo.Collection._fakePublish = function(result) {
    if (Array.isArray(result)) {
      result.forEach(subResult => Mongo.Collection._fakePublish(subResult));
      return;
    }

    const name = result._cursorDescription.collectionName;
    const selector = result._cursorDescription.selector;

    if (!Mongo.Collection._publishSelectorsSSR[name]) {
      Mongo.Collection._publishSelectorsSSR[name] = [];
    }

    Mongo.Collection._publishSelectorsSSR[name].push(selector);
  };

  // TEMP FIX
  // From mongo core package
  // https://github.com/meteor/meteor/blob/d1ae8f25be68c2f2d79a68295ebd5576ed27b5fb/packages/mongo/collection.js
  Mongo.Collection.prototype._getFindOptions = function(args) {
    var self = this;
    if (args.length < 2) {
      return { transform: self._transform };
    } else {
      // Removed the check
      // It fails for no reason :-(
      // If you know why, send a PR!

      /*check(args[1], Match.Optional(Match.ObjectIncluding({
        fields: Match.Optional(Match.OneOf(Object, undefined)),
        sort: Match.Optional(Match.OneOf(Object, Array, undefined)),
        limit: Match.Optional(Match.OneOf(Number, undefined)),
        skip: Match.Optional(Match.OneOf(Number, undefined))
     })));*/

     return _.extend({
        transform: self._transform
      }, args[1]);
    }
  };
}
