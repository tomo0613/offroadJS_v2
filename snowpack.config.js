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
        open: 'firefox',
        port: 3000,
    },
};
