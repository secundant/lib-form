const createImportPlugin = (libraryName, pathName) => [
  'babel-plugin-import',
  {
    libraryName,
    // Use "'libraryDirectory': ''," if your bundler does not support ES modules
    libraryDirectory: '',
    camel2DashComponentName: false
  },
  pathName
];

module.exports = api => {
  api.cache(true);

  return {
    plugins: [
      createImportPlugin('@material-ui/core', 'core')
    ]
  };
};
