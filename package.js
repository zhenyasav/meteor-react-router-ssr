Package.describe({
  name: 'reactrouter:react-router-ssr',
  version: '2.1.0',
  summary: 'Server-side rendering for react-router and react-meteor-data rehydratating Meteor subscriptions',
  git: 'https://github.com/thereactivestack/meteor-react-router-ssr.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');
  api.use([
    'ecmascript',
    'minimongo@1.0.0',
    'meteorhacks:fast-render@2.12.0',
    'meteorhacks:inject-data@2.0.0'
  ]);

  api.use('webapp@1.2.0', 'server');
  api.use('mongo@1.0.0', 'server');
  api.use('autopublish@1.0.0', 'server', {weak: true});

  api.use('tmeasday:publish-counts@0.7.0', 'server', {weak: true});
  api.use(['routepolicy@1.0.5'], ['server']);

  api.mainModule('imports/client.jsx', 'client');
  api.mainModule('imports/server.jsx', 'server');
});
