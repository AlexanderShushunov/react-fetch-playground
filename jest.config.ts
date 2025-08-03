export default {
    testEnvironment: "jest-environment-jsdom",
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
            tsconfig: "tsconfig.test.json",
        }],

    },
    moduleNameMapper: {
        "\\.(css)$": "<rootDir>/jest/styleMock.cjs",
    },
    setupFilesAfterEnv: ["<rootDir>/jest/jest.setup.ts"],
};
