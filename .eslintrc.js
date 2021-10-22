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
        'import/extensions': [ERROR, 'never'],
        'import/no-extraneous-dependencies': [WARNING, { devDependencies: true }],
        'import/no-unresolved': DISABLED,
        'import/order': [WARNING, importOrder_ruleConfig],
        'import/prefer-default-export': DISABLED,
        'react/jsx-uses-react': DISABLED,
        'react/react-in-jsx-scope': DISABLED,
        'brace-style': [WARNING, '1tbs', { allowSingleLine: false }],
        'camelcase': DISABLED,
        'curly': [WARNING, 'all'],
        'func-names': [WARNING, 'as-needed'],
        'indent': [WARNING, 4, { SwitchCase: 1 }],
        'linebreak-style': DISABLED,
        'lines-between-class-members': [WARNING, 'always', { exceptAfterSingleLine: true }],
        'max-len': [WARNING, 120],
        'no-continue': DISABLED,
        'no-dupe-class-members': DISABLED,
        'no-mixed-operators': [ERROR, noMixedOperators_ruleConfig],
        'no-multi-spaces': WARNING,
        'no-multiple-empty-lines': [WARNING, { max: 1 }],
        'no-param-reassign': DISABLED,
        'no-plusplus': DISABLED,
        'no-prototype-builtins': DISABLED,
        'no-shadow': DISABLED,
        'no-underscore-dangle': DISABLED,
        'no-use-before-define': DISABLED,
        'object-curly-newline': DISABLED,
        'quote-props': [WARNING, 'consistent-as-needed', { numbers: true }],
        'sort-imports': DISABLED,
        'wrap-iife': DISABLED,
        '@typescript-eslint/camelcase': DISABLED,
        '@typescript-eslint/explicit-function-return-type': DISABLED,
        '@typescript-eslint/explicit-member-accessibility': DISABLED,
        '@typescript-eslint/explicit-module-boundary-types': DISABLED,
        '@typescript-eslint/member-delimiter-style': WARNING,
        '@typescript-eslint/no-empty-function': WARNING,
        '@typescript-eslint/no-shadow': ERROR,
        '@typescript-eslint/no-use-before-define': [ERROR, 'nofunc'],
    },
};
