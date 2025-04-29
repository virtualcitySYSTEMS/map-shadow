import { configs } from '@vcsuite/eslint-config';

export default [
  ...configs.vueTs,
  {
    ignores: ['node_modules/', 'dist/'],
  },
  {
    rules: {
      'import/no-unresolved': [
        2,
        {
          ignore: ['^@vcmap/ui'],
        },
      ],
      'import/no-cycle': 'off',
    },
  },
];
