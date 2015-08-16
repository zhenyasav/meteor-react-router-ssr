# Install
`meteor add reactrouter:react-router-ssr`

# Usage
## `ReactRouterSSR.Run(routes)`
The `routes` argument takes the routes you want react-router to use (you don't have to call `React.render()` yourself)<br />
Read the [react-router documentation](http://rackt.github.io/react-router/tags/v1.0.0-beta3.html) for more informations.

# Example
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

ReactRouterSSR.Run(AppRoutes);
```

# Warning
This is using react-router 1.0 even though it is still in beta. The API is stable and working very well in production.
