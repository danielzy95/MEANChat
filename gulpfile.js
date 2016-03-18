'use strict';

let gulp            = require('gulp'),
	autoprefixer    = require('gulp-autoprefixer'),
	browserify      = require('browserify'),
	babel           = require('gulp-babel'),
	buffer          = require('vinyl-buffer'),
	clean           = require('gulp-clean'),
	concat          = require('gulp-concat'),
	copy            = require('gulp-copy'),
	csscomb         = require('gulp-csscomb'),
	csso            = require('gulp-csso'),
	htmlhint        = require('gulp-htmlhint'),
	htmlmin         = require('gulp-htmlmin'),
	imagemin        = require('gulp-imagemin'),
	server          = require('gulp-develop-server'),
	livereload      = require('gulp-livereload'),
	sass            = require('gulp-sass'),
	source          = require('vinyl-source-stream'),
	stripDebug      = require('gulp-strip-debug'),
	transform       = require('vinyl-transform'),
	uglify          = require('gulp-uglify'),
	uncss           = require('gulp-uncss'),
	util            = require('gulp-util');

let path = {};

path.dev = {};
path.dev.app = {};
path.dev.assets = {};
path.public = {};
path.server = [ 'bin/www', 'app.js', 'routes/**/*.js' ];
path.views = "views/";

let app = "dev/app/";
path.dev.app.root = app;
path.dev.app.components = app + "components/";
path.dev.app.services = app + "services/";
path.dev.app.shared = app + "shared/";

let assets = "dev/assets/";
path.dev.assets.root = assets;
path.dev.assets.fonts = assets + "fonts/";
path.dev.assets.img = assets + "img/";
path.dev.assets.vendor = assets + "vendor/";

let pbl = "public/";

path.public.css = pbl + "css/";
path.public.fonts = pbl + "fonts/";
path.public.img = pbl + "img/";
path.public.js = pbl + "js/";
path.public.vendor = pbl + "vendor/";
path.public.views = pbl + "views/";
path.public.templates = pbl + "templates/";

let production = util.env.type === 'prod';

// DEVELOP SERVER TASKS

gulp.task ( 'server:start', () => {
	server.listen( { path: 'bin/www' } );
} );

gulp.task ( 'server:restart', server.restart );

gulp.task ('reload-serverviews', () => {
	return gulp.src ( path.views + '**/*.ejs' )
		.pipe ( livereload() );
} );

// JS TASKS

gulp.task ( 'js', () => {
	return gulp.src ( [ path.dev.app.root + '*.js', path.dev.app.components + '**/*.js', 
						path.dev.app.shared + '**/*.js', path.dev.app.services + '**/*.js' ] )
		.pipe( babel(
			{
				presets: [ 'es2015' ] 
			}
		) )
		.pipe( concat('bundle.js') )
		.pipe( production ? stripDebug() : util.noop() )
		.pipe( production ? uglify() : util.noop() )
		.pipe( gulp.dest(path.public.js) )
		.pipe( livereload() );
} );

gulp.task ('browserify', () => {
    return browserify( path.public.js + "bundle.js" )
        .bundle()
        .pipe( source ( 'bundle.js' ) )
        .pipe( gulp.dest( path.public.js ) );
});

// CSS TASKS

gulp.task ( 'css', () => {
	return gulp.src ( [ path.dev.app.components + "**/*.scss",
		path.dev.app.shared + "**/*.scss" ] )
		.pipe( sass() )
		.pipe( concat('style.css') )
		.pipe( csso (
			{
	            restructure: production,
	            sourceMap: !production,
	            debug: !production
        	}
        ))
		.pipe( production ? util.noop() : csscomb() )
		.pipe( autoprefixer( { browsers: [ "> 0%" ] } ) )
		.pipe( gulp.dest(path.public.css) )
		.pipe( livereload() );
} );

// HTML TASKS

gulp.task ( 'views', () => {
	return gulp.src( path.dev.app.components + "**/*.html" )
		.pipe( htmlmin( { collapseWhitespace: true } ) )
		.pipe( htmlhint() )
		.pipe( gulp.dest( path.public.views ) )
		.pipe( livereload() );
} );

gulp.task ( 'templates', () => {
	return gulp.src( path.dev.app.shared + "**/*.html" )
		.pipe( htmlmin( { collapseWhitespace: true } ) )
		.pipe( htmlhint() )
		.pipe( gulp.dest( path.public.templates ) )
		.pipe( livereload() );
} );

// ASSETS TASKS

gulp.task ( 'img', () => {
	return gulp.src( path.dev.assets.img + "*.*" )
		.pipe( imagemin() )
		.pipe( gulp.dest( path.public.img ) )
		.pipe( livereload() );
} );

gulp.task ( 'watch', () => {
	livereload.listen();

	gulp.watch ( [ path.dev.app.root + '*.js', path.dev.app.components + '**/*.js', 
				   path.dev.app.shared + '**/*.js', path.dev.app.services + '**/*.js' ], [ 'js', 'browserify' ] );

	gulp.watch ( [ path.dev.app.components + "**/*.scss", 
				   path.dev.app.shared + "**/*.scss" ], [ 'css' ] );

	gulp.watch ( path.dev.app.components + "**/*.html", [ 'views' ] );
	gulp.watch ( path.dev.app.shared + "**/*.html", [ 'templates' ] );

	gulp.watch ( path.views + '**/*.ejs', [ 'reload-serverviews' ] );

	gulp.watch ( path.server, [ 'server:restart' ] );
} );

gulp.task ( 'default', [ 'server:start', 'watch' ] );