Package.describe({
  name: 'reactrouter:react-router-ssr',
  version: '3.0.0',
  summary: 'Server-side rendering for react-router and react-meteor-data rehydratating Meteor subscriptions',
  git: 'https://github.com/thereactivestack/meteor-react-router-ssr.git',
  documentation: 'README.md'
});

Npm.depends({
  'cookie-parser': '1.3.5',
  'cheerio': '0.19.0'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');

  api.use([
    'tmeasday:check-npm-versions@0.2.0',
    'jsx@0.2.3',
    'minimongo@1.0.0',
    'react-meteor-data@0.2.4',
    'meteorhacks:fast-render@2.12.0',
    'meteorhacks:inject-data@2.0.0',
  ]);

  api.use('webapp@1.2.0', 'server');
  api.use('underscore@1.0.3', 'server');
  api.use('mongo@1.0.0', 'server');
  api.use('autopublish@1.0.0', 'server', {weak: true});

  api.use('nfl:react-helmet@2.2.0', 'server', {weak: true});
  api.use('promise@0.5.1', 'server', {weak: true});

  api.use('tmeasday:publish-counts@0.7.0', 'server', {weak: true});

  api.use(['routepolicy@1.0.5'], ['server']);

  api.export('ReactRouterSSR');
  api.mainModule('lib/react-router-ssr.js');
});
