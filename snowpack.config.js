/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        public: '/',
        src: '/_src_',
    },
    plugins: [
        '@snowpack/plugin-typescript',
        '@snowpack/plugin-react-refresh',
    ],
    devOptions: {
        port: 3000,
        open: 'firefox',
    },
};
