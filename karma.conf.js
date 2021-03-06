module.exports = function (config) {
    config.set({

        basePath: '',

        angularCli: {
            environment: 'dev'
        },

        autoWatch: true,

        frameworks: ['jasmine', '@angular-devkit/build-angular'],

        browsers: ['ChromeHeadless'],

        customLaunchers: {
            ChromeHeadless: {
                base: 'Chrome',
                flags: [
                    '--headless',
                    '--disable-gpu',
                    '--no-sandbox',
                    '--remote-debugging-port=9222'
                ]
            }
        },

        reporters: ['progress', 'coverage-istanbul', 'istanbul-threshold'],

        coverageIstanbulReporter: {
            reports: ['html', 'json'],
            fixWebpackSourcePaths: true
        },
        istanbulThresholdReporter: {
            src: 'coverage/coverage-final.json',
            reporters: ['text'],
            thresholds: {
                global: {
                    statements: 100,
                    branches: 100,
                    functions: 100,
                    lines: 100
                }
            }
        },

        plugins: [
            require('karma-chrome-launcher'),
            require('karma-jasmine'),
            require('karma-coverage-istanbul-reporter'),
            require('karma-istanbul-threshold'),
            require('@angular-devkit/build-angular/plugins/karma')
        ]

    });
};