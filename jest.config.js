module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.ts'],
    testMatch: [
        '**/tests/**/*.test.ts'
    ],
};
