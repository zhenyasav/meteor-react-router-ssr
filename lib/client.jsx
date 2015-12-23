const {Router} = ReactRouter;

ReactRouterSSR.Run = function(routes, clientOptions) {
  if (!clientOptions) {
    clientOptions = {};
  }

  const history = clientOptions.history || ReactRouter.history.useQueries(ReactRouter.history.createHistory)();

  Meteor.startup(function() {
    const rootElementName = clientOptions.rootElement || 'react-app';
    let rootElement = document.getElementById(rootElementName);

    // In case the root element doesn't exist, let's create it
    if (!rootElement) {
      rootElement = document.createElement('div');
      rootElement.id = rootElementName;
      document.body.appendChild(rootElement);
    }

    // If using redux, create the store with the initial state sent by the server. 
    let reduxStore;
    if (typeof clientOptions.createReduxStore !== 'undefined') {
      let initialState;
      InjectData.getData('redux-initial-state', data => {initialState = JSON.parse(data)});
      reduxStore = clientOptions.createReduxStore(history, initialState);
    }

    let app = (
      <Router
        history={history}
        children={routes}
        {...clientOptions.props} />
    );

    if (clientOptions.wrapper) {
      const wrapperProps = {};
      // Pass the redux store to the wrapper, which is supposed to be some
      // flavour or react-redux's <Provider>.
      if (reduxStore) {
        wrapperProps.store = reduxStore;
      }
      app = <clientOptions.wrapper {...wrapperProps}>{app}</clientOptions.wrapper>;
    }

    ReactDOM.render(app, rootElement);

    let collectorEl = document.getElementById(clientOptions.styleCollectorId || 'css-style-collector-data')

    if (collectorEl) {
      collectorEl.parentNode.removeChild(collectorEl);
    }
  });
}
