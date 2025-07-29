const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const browserSync = require("browser-sync").create();
const esbuild = require("gulp-esbuild");
const ts = require("gulp-typescript");

// Projects
const serverTSProject = ts.createProject("tsconfig.server.json");

// Paths
const paths = {
	client: {
		entry: "src/client/index.tsx",
		scripts: "src/client/**/*.{ts,tsx}",
		styles: "src/client/styles/**/*.scss",
		static: "public/**/*",
	},
	server: {
		scripts: "src/server/**/*.ts",
	},
	dest: {
		clientJS: "dist/public/js",
		clientCSS: "dist/public/css",
		static: "dist/public",
		serverJS: "dist",
	},
};

// Bundle client with esbuild
const esbuildNative = require("esbuild");

function bundleClient() {
	return esbuildNative
		.build({
			entryPoints: [paths.client.entry],
			bundle: true,
			outfile: `${paths.dest.clientJS}/bundle.js`,
			sourcemap: true,
			minify: false,
			target: ["es2020"],
			loader: { ".tsx": "tsx", ".ts": "ts" },
			define: { "process.env.NODE_ENV": '"development"' },
			// watch: false,  <-- REMOVE THIS LINE completely
		})
		.then(() => {
			browserSync.reload();
		});
}

// Compile Sass
function styles() {
	return gulp
		.src(paths.client.styles)
		.pipe(sass().on("error", sass.logError))
		.pipe(gulp.dest(paths.dest.clientCSS))
		.pipe(browserSync.stream());
}

// Copy static assets
function staticAssets() {
	return gulp
		.src(paths.client.static)
		.pipe(gulp.dest(paths.dest.static))
		.pipe(browserSync.stream());
}

// Compile backend
function serverScripts() {
	return serverTSProject
		.src()
		.pipe(serverTSProject())
		.js.pipe(gulp.dest(paths.dest.serverJS));
}

// Watch & Live reload
function watch() {
	browserSync.init({
		server: {
			baseDir: "./dist/public",
		},
		port: 3000,
		ui: {
			port: 3002, // BrowserSync UI dashboard port (pick any unused port)
		},
	});

	gulp.watch(paths.client.scripts, bundleClient);
	gulp.watch(paths.client.styles, styles);
	gulp.watch(paths.client.static, staticAssets);
	gulp.watch(paths.server.scripts, gulp.series(serverScripts));
}

// Build task
const build = gulp.series(
	gulp.parallel(bundleClient, styles, staticAssets, serverScripts)
);

const dev = gulp.series(build, watch);

exports.bundleClient = bundleClient;
exports.styles = styles;
exports.staticAssets = staticAssets;
exports.serverScripts = serverScripts;
exports.watch = watch;
exports.build = build;
exports.watch = watch;
exports.default = dev;
