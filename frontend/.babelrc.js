module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      ['@babel/preset-env', {
        useBuiltIns: 'entry',
      }],
      ['minify', {
        keepFnName: true,
      }],
      ['@babel/preset-react'],
    ],
    plugins: [
      ['@babel/transform-runtime'],
    ],
  };
};
