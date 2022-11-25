const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const { DefinePlugin } = require("webpack");
const characters = require("./characters.json");

module.exports = characters.map(({ name, id, ctype }) => ({
    entry: "./src/index.ts",
    output: {
        filename: `${name}.${id}.js`,
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new DefinePlugin({
            "character.name": JSON.stringify(name),
            "character.ctype": JSON.stringify(ctype),
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: false,
                terserOptions: {
                    compress: false,
                    mangle: false,
                },
            }),
        ],
    },
    mode: "production",
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.[jt]s$/,
                exclude: /node_modules/,
                use: {
                    loader: require.resolve(`babel-loader`),
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                    },
                },
            },
        ],
    },
}));
