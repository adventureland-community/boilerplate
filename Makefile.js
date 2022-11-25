const fs = require("fs");
const path = require("path");
const util = require("util");
const _ = require("lodash");
const { execSync } = require("child_process");
const dayjs = require("dayjs");
const webpack = util.promisify(require("webpack"));
const chalk = require("chalk");

function log(...args) {
    console.log(`[${dayjs().format("HH:mm:ss.SSS")}]`, ...args);
}

const chars = require("./characters.json");

const filenames = chars.map(({ name, id }) => path.resolve(__dirname, "dist", `${name}.${id}.js`));

// TODO: You need to replace this value!
const ADVENTURE_LAND_CODES_PATH =
    "path/to/Adventure Land/autosync0123465789/adventureland/characters";

/** This command will push your files to your remote server. */
// TODO: If you want to use this command, you have to fill the server and path!
exports.push = async () => {
    const targetServer = "telokis.com"; // The name to use to connect to your server
    const targetPath = "caracAL/CODE/"; // The folder to place the files into

    try {
        log(`Copying files to remote server...`);
        execSync(`scp ${filenames.map((f) => `"${f}"`).join(" ")} "${targetServer}:${targetPath}"`);
        log(`Done!`);
    } catch (err) {
        log("Failed:", err);
    }
};

/** This command will bundle your files once. */
exports.generate = async () => {
    const start = Date.now();

    console.log("------------------------------------------");
    log(`Generating bundle...`);

    const stats = await webpack(require("./webpack.config"));

    if (stats.hasErrors()) {
        log(`Errors while bundling.`);
        console.log(
            stats.toString({
                colors: true,
            }),
        );
        return;
    }

    console.log(
        stats
            .toString({
                colors: false,
                moduleAssets: false,
                modules: false,
                version: false,
                timings: false,
            })
            .replaceAll("webpack compiled successfully", "")
            .replace(/\n+/g, "\n")
            .replaceAll(" [compared for emit] [minimized] (name: main)", "")
            .trim()
            .replace(/asset ([^.]+)/gi, `Asset ${chalk.green("$1")}`)
            .replace(/([0-9]+(?:.[0-9]+)? [a-z]+)/gi, chalk.cyan("$1")),
    );

    log(`Bundle generated!`);

    if (
        fs.existsSync(ADVENTURE_LAND_CODES_PATH) &&
        fs.statSync(ADVENTURE_LAND_CODES_PATH).isDirectory()
    ) {
        log(`Copying files to Steam directory...`);

        await Promise.all(
            chars.map(({ name, id }) =>
                fs.promises.copyFile(
                    path.resolve(__dirname, "dist", `${name}.${id}.js`),
                    path.resolve(ADVENTURE_LAND_CODES_PATH, `${name}.${id}.js`),
                ),
            ),
        );

        log(`Files copied, all is done! Took ${Date.now() - start}ms.`);
    } else {
        log("Skipping copy of files because variable ADVENTURE_LAND_CODES_PATH is not set.");
    }

    console.log("------------------- OK -------------------");
};

/** This command will watch over your files and bundle them when something changes. */
exports.watch = async () => {
    const chokidar = require("chokidar");

    // We build at most once every 5s even if files change often.
    const doBuild = _.throttle(exports.generate, 5000);

    await doBuild();

    const watcher = chokidar.watch(["characters.json", ".babelrc.js", "src/**/*.{js,ts,json}"], {
        persistent: false,
    });

    watcher.on("all", () => {
        doBuild();
    });

    // Busy loop to keep the watch going
    let stop = false;
    const interval = setInterval(() => {
        if (stop) {
            clearInterval(interval);
        }
    }, 500);

    process.on("SIGINT", () => {
        watcher.close().then(() => {
            log("Forcing exit...");
            stop = true;
        });
    });
};
