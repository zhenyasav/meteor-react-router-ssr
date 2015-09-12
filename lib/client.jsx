const {Router} = ReactRouter;

ReactRouterSSR.Run = function(routes, clientOptions) {
  if (!clientOptions) {
    clientOptions = {};
  }

  const history = clientOptions.history || ReactRouter.history.useQueries(ReactRouter.history.createHistory)();

  Meteor.startup(function() {
    React.render((
      <Router
        history={history}
        children={routes}
        {...clientOptions.props} />
    ), document.getElementById(clientOptions.rootElement || 'react-app'));
  });
}
