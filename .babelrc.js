module.exports = (api) => {
    const env = process.env.BABEL_ENV || process.env.NODE_ENV || "development";

    api.cache(() => env);

    const res = {
        parserOpts: {
            strictMode: true,
        },
        plugins: [
            require("@babel/plugin-transform-typescript"),
            [
                require("babel-plugin-module-resolver"),
                {
                    extensions: [".js", ".ts"],
                },
            ],
        ],
    };

    if (env === "test") {
        res.plugins.push(require("@babel/plugin-transform-modules-commonjs"));
    }

    return res;
};
