## Install
`meteor add reactrouter:react-router-ssr`

## Usage
### `ReactRouterSSR.Run(routes, [clientOptions], [serverOptions])`
The `routes` argument takes the routes you want react-router to use (you don't have to call `React.render()` yourself)<br />
Read the [react-router documentation](http://rackt.github.io/react-router/tags/v1.0.0-beta3.html) for more informations.

#### routes
Your main `<Route />` node of your application.

#### clientOptions (optional)
The additional arguments you would like to give to the `<Router />` component on the client.

#### serverOptions (optional)
The additional arguments you would like to give to the `<Router />` component on the server.

## Server-side cookies
Also brings `ReactCookie` to work with cookie both server-side and client-side. Cookies modified on the server are sent to the client. You can use `ReactCookie.save` and `ReactCookie.load`.<br />
See the [react-cookie readme](https://github.com/eXon/react-cookie) for more informations.

## Example
```javascript
const {Route} = ReactRouter;

AppRoutes = (
  <Route path="/" component={App}>
    <Route path="/" component={HomePage} />
    <Route path="login" component={LoginPage} />
    <Route path="*" component={NotFoundPage} />
    {/* ... */}
  </Route>
);

ReactRouterSSR.Run(AppRoutes, {
  onUpdate() {
    // Notify the page has been changed to Google Analytics
    ga('send', 'pageview');
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

## Warning
This is using react-router 1.0 even though it is still in beta. The API is stable and working very well in production.
