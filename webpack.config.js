module.exports = [
  {
    mode: 'development',
    output: {
      library: 'mockster',
      libraryTarget: 'umd',
      filename: 'mockster.js',
    },
  },
  {
    mode: 'production',
    output: {
      library: 'mockster',
      libraryTarget: 'umd',
      filename: 'mockster.min.js',
    },
  },
];
