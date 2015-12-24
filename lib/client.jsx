const {Router} = ReactRouter;

ReactRouterSSR.Run = function(routes, clientOptions) {
  if (!clientOptions) {
    clientOptions = {};
  }

  const history = clientOptions.history || ReactRouter.history.useQueries(ReactRouter.history.createHistory)();

  Meteor.startup(function() {
    const rootElementName = clientOptions.rootElement || 'react-app';
    const rootElementType = clientOptions.rootElementType || 'div';
    const attributes = clientOptions.rootElementAttributes instanceof Array ? clientOptions.rootElementAttributes : [];
    let rootElement = document.getElementById(rootElementName);

    // In case the root element doesn't exist, let's create it
    if (!rootElement) {
      rootElement = document.createElement(rootElementType);
      rootElement.id = rootElementName;

      // check if a 2-dimensional array was passed... if not, be nice and handle it anyway
      if(attributes[0] instanceof Array) {
        // set attributes
        for(var i = 0; i < attributes.length; i++) {
          rootElement.setAttribute(attributes[i][0], attributes[i][1]);
        }
      } else if (attributes.length > 0){
        rootElement.setAttribute(attributes[0], attributes[1]);
      }

      document.body.appendChild(rootElement);
    }

    let app = (
      <Router
        history={history}
        children={routes}
        {...clientOptions.props} />
    );

    if (clientOptions.wrapper) {
      app = <clientOptions.wrapper>{app}</clientOptions.wrapper>;
    }

    ReactDOM.render(app, rootElement);

    let collectorEl = document.getElementById(clientOptions.styleCollectorId || 'css-style-collector-data')

    if (collectorEl) {
      collectorEl.parentNode.removeChild(collectorEl);
    }
  });
}
