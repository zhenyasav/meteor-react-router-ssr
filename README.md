Server-side rendering for react-router and react-meteor-data rehydratating Meteor subscriptions

## Install
`meteor add reactrouter:react-router-ssr`

## Usage
### `ReactRouterSSR.Run(routes, [clientOptions], [serverOptions])`
The `routes` argument takes the routes you want react-router to use (you don't have to call `React.render()` yourself)<br />
Read the [react-router documentation](https://github.com/rackt/react-router/tree/master/docs) for more informations.

#### routes
Your main `<Route />` node of your application.<br />
**Notice that their is no `<Router />` element, ReactRouterSSR takes care of creating it on the client and server with the correct parameters**

#### clientOptions (optional)
- `rootElement` [string]: The root element ID your React application is mounted (default to `react-app`)
- `props` [object]: The additional arguments you would like to give to the `<Router />` component on the client.
- `history`: History object to use. You can use `new ReactRouter.history.createHistory()`, `new ReactRouter.history.createHashHistory()` or `new ReactRouter.history.createMemoryHistory()`

#### serverOptions (optional)
- `props` [object]: The additional arguments you would like to give to the `<Router />` component on the server.
- `preRender` [function(req, res)]: Executed just before the renderToString
- `postRender` [function(req, res)]: Executed just after the renderToString

## Simple Example
```javascript
const {IndexRoute, Route} = ReactRouter;

AppRoutes = (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="login" component={LoginPage} />
    <Route path="*" component={NotFoundPage} />
    {/* ... */}
  </Route>
);

HomePage = React.createClass({
  mixins: [ReactMeteorData],
  
  getMeteorData() {
    Meteor.subscribe('profile');
  
    return {
      profile: Profile.findOne({ user: Meteor.userId() })
    };
  },

  render() {
    return <div>Hi {profile.name}</div>;
  }
});

ReactRouterSSR.Run(AppRoutes);
```

## Complex Example
```javascript
const {IndexRoute, Route} = ReactRouter;

AppRoutes = (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="login" component={LoginPage} />
    <Route path="*" component={NotFoundPage} />
    {/* ... */}
  </Route>
);

ReactRouterSSR.Run(AppRoutes, {
  props: {
    onUpdate() {
      // Notify the page has been changed to Google Analytics
      ga('send', 'pageview');
    }
  }
}, {
  preRender: function(req, res) {
    ReactCookie.plugToRequest(req, res);
  }
});

if (Meteor.isClient) {
  // Load Google Analytics
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-XXXXXXXX-X', 'auto');
  ga('send', 'pageview');
}
```

