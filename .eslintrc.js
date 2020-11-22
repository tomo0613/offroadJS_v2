const DISABLED = 0;
const WARNING = 1;
const ERROR = 2;

// https://dev.to/otamnitram/sorting-your-imports-correctly-in-react-213m
const importOrder_ruleConfig = {
    'groups': ['builtin', 'external', 'internal'],
    'alphabetize': {
        order: 'asc',
        caseInsensitive: true,
    },
    'newlines-between': 'always',
};
const noMixedOperators_ruleConfig = {
    allowSamePrecedence: true,
    groups: [
        ['%', '**'],
        ['&', '|', '^', '~', '<<', '>>', '>>>'],
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof'],
    ],
};

module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    env: {
        browser: true,
        node: true,
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        'sort-imports': DISABLED,
        'import/extensions': [ERROR, 'never'],
        'import/no-unresolved': DISABLED,
        'import/order': [ERROR, importOrder_ruleConfig],
        'import/prefer-default-export': DISABLED,
        'indent': [ERROR, 4, { SwitchCase: 1 }],
        'linebreak-style': DISABLED,
        'lines-between-class-members': [WARNING, 'always', { exceptAfterSingleLine: true }],
        'max-len': [ERROR, 120],
        'no-dupe-class-members': DISABLED,
        'no-param-reassign': DISABLED,
        'no-continue': DISABLED,
        'no-mixed-operators': [ERROR, noMixedOperators_ruleConfig],
        'no-multi-spaces': WARNING,
        'no-multiple-empty-lines': [ERROR, { max: 1 }],
        'no-plusplus': DISABLED,
        'no-prototype-builtins': DISABLED,
        'no-underscore-dangle': DISABLED,
        'no-use-before-define': DISABLED,
        'object-curly-newline': DISABLED,
        'quote-props': [WARNING, 'consistent-as-needed', { numbers: true }],
        'wrap-iife': DISABLED,
        '@typescript-eslint/no-use-before-define': [ERROR, 'nofunc'],
        'camelcase': DISABLED,
        '@typescript-eslint/camelcase': DISABLED,
        '@typescript-eslint/explicit-function-return-type': DISABLED,
        '@typescript-eslint/no-empty-function': WARNING,
        'no-shadow': DISABLED,
        '@typescript-eslint/no-shadow': ERROR,
        '@typescript-eslint/explicit-member-accessibility': DISABLED,
        '@typescript-eslint/explicit-module-boundary-types': DISABLED,
    },
};
