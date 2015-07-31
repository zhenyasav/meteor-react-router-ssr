ReactRouterSSR.Run = function(routes) {
  const {Router} = ReactRouter;
  const {history} = ReactRouter.lib.BrowserHistory;

  Meteor.startup(function() {
    React.render((
      <Router history={history} children={routes} />
    ), document.getElementById('react-app'));
  });
}
