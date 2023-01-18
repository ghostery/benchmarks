module.exports = {
  'env': {
    'node': true,
    'es2021': true,
  },
  'extends': ['eslint:recommended', 'plugin:prettier/recommended'],
  'overrides': [],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'plugins': ['prettier'],
  'rules': {
    'prettier/prettier': 'error',
  },
};
