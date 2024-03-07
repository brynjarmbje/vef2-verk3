export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // other configurations...
    moduleNameMapper: {
        '^(\\..*)\\.js$': '$1', // Redirect .js imports to their .ts source file
      },
  };