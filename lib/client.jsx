ReactRouterSSR.Run = function(routes, clientOptions) {
  const {Router} = ReactRouter;
  const {history} = ReactRouter.lib.BrowserHistory;

  Meteor.startup(function() {
    let props = _.extend({
      history,
      children: routes
    }, clientOptions);

    React.render((
      <Router {...props} />
    ), document.getElementById('react-app'));
  });
}
