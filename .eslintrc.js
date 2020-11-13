const DISABLED = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/recommended',
    ],
    env: {
        'browser': true,
        'node': true,
    },
    rules: {
        'sort-imports': WARNING,
        'import/extensions': [ERROR, 'never'],
        // https://dev.to/otamnitram/sorting-your-imports-correctly-in-react-213m
        'indent': [ERROR, 4, {SwitchCase: 1}],
        'max-len': [ERROR, 120],
        'no-dupe-class-members': DISABLED,
        'no-param-reassign': DISABLED,
        'no-plusplus': DISABLED,
        'no-continue': DISABLED,
        'no-prototype-builtins': DISABLED,
        'no-multi-spaces': WARNING,
        'wrap-iife': DISABLED,
        'import/prefer-default-export': DISABLED,
        'import/no-unresolved': DISABLED,
        'no-use-before-define': [ERROR, 'nofunc'],
        '@typescript-eslint/no-use-before-define': [ERROR, 'nofunc'],
        '@typescript-eslint/camelcase': DISABLED,
        'object-curly-newline': DISABLED,
        '@typescript-eslint/explicit-function-return-type': DISABLED,
        '@typescript-eslint/no-empty-function': WARNING,
        'lines-between-class-members': [WARNING, 'always', {"exceptAfterSingleLine": true}],
        'no-underscore-dangle': DISABLED,
        '@typescript-eslint/explicit-member-accessibility': DISABLED,
        'linebreak-style': DISABLED,
        'no-mixed-operators': [ERROR, {
            allowSamePrecedence: true,
            groups: [
                ["%", "**"],
                ["&", "|", "^", "~", "<<", ">>", ">>>"],
                ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
                ["&&", "||"],
                ["in", "instanceof"]
            ],
        }],
    },
};
