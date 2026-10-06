module.exports = {
  presets: [['@babel/preset-env', {
    targets: { ie: '11' },
    modules: false,
    useBuiltIns: false,
    forceAllTransforms: true,
  }]],
  comments: false,
};
