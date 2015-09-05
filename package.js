Package.describe({
  name: 'reactrouter:react-router-ssr',
  version: '0.1.8',
  summary: 'server-side rendering for react-router',
  git: 'https://github.com/thereactivestack/meteor-react-router-ssr.git',
  documentation: 'README.md'
});

Npm.depends({
  'cookie-parser': '1.3.5'
});

Package.onUse(function(api) {
  api.use([
    'jsx@0.1.0',
    'react-meteor-data@0.1.5',
    'reactrouter:react-router@0.1.6',
    'meteorhacks:fast-render@2.9.0'
  ]);

  api.imply(['reactrouter:react-router@0.1.6']);

  api.use(['routepolicy@1.0.5'], ['server']);

  api.add_files(['lib/react-router-ssr.js']);

  api.add_files(['lib/client.jsx'], 'client');
  api.add_files(['lib/server.jsx'], 'server');

  api.export('ReactRouterSSR');
});
