import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
  react: '15.x',
  'react-dom': '15.x',
  'react-router': '2.x'
}, 'thereactivestack:react-router-ssr');

if (Meteor.isServer) {
  ReactRouterSSR = require('./server.jsx').default;
} else {
  ReactRouterSSR = require('./client.jsx').default;
}

export default ReactRouterSSR;
