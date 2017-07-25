// http://eslint.org/docs/user-guide/configuring

module.exports = {
  "root": true,
  'fix': true,
  "parserOptions": {
    "ecmaVersion": 7,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "env": {
    "node": true,
    "es6" : true
  },
  'format': './node_modules/eslint-friendly-formatter',
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  'extends': 'standard',
  // add your custom rules here
  'rules': {
    'no-var': 2,
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
