Package.describe({
  name: 'reactrouter:react-router-ssr',
  version: '0.1.2',
  summary: 'server-side rendering for react-router',
  git: 'https://github.com/thereactivestack/meteor-react-router-ssr.git',
  documentation: 'README.md'
});

Npm.depends({
  'cookie-parser': '1.3.5'
});

Package.onUse(function(api) {
  api.use([
    'react@0.1.4',
    'reactrouter:react-router@0.1.1',
    'meteorhacks:fast-render@2.7.1'
  ]);

  api.use(['routepolicy'], ['server']);

  api.add_files(['lib/react-router-ssr.js']);
  api.add_files(['lib/client.jsx'], 'client');
  api.add_files(['lib/server.jsx'], 'server');

  api.export('ReactRouter');
  api.export('ReactRouterSSR');
});
