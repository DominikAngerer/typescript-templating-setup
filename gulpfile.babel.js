const argv = require('yargs').argv
const assemble = require('assemble')
const autoprefixer = require('gulp-autoprefixer')
const browserify = require('browserify')
const browserSync = require('browser-sync')
const buffer = require('vinyl-buffer')
const concat = require('gulp-concat')
const del = require('del')
const extname = require('gulp-extname')
const File = require('vinyl')
const fs = require('fs')
const globbing = require('gulp-css-globbing')
const gitrev = require('git-rev')
const gulp = require('gulp')
const gulpAssemble = require('gulp-assemble')
const gulpif = require('gulp-if')
const htmlmin = require('gulp-html-minifier')
const imagemin = require('gulp-imagemin')
const plumber = require('gulp-plumber')
const sass = require('gulp-sass')
const source = require('vinyl-source-stream')
const size = require('gulp-size')
const tsify = require('tsify')
const util = require('gulp-util')

const reload = browserSync.reload
const externals = require('./externals.js')
const isProduction = (typeof argv.production !== 'undefined') ? true : false

gulp.task('clean', function () {
  del.sync(['dist'])
})

gulp.task('version', function () {
  return gitrev.long(function (str) {
    return string_src('version.cache', str).pipe(gulp.dest('dist'))
  })
})

gulp.task('content', function () {
  return gulp.src('app/**/*.{xml,json,yml}')
    .pipe(gulp.dest('dist'))
})

gulp.task('fonts', function () {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))
})

gulp.task('templates', function () {
  assemble.layouts(['app/templates/layouts/*.hbs'])
  assemble.partials(['app/templates/components/*.hbs'])
  gulp.src('app/templates/pages/*.hbs')
    .pipe(plumber(function (error) {
      util.log(util.colors.red(error.message))
      this.emit('end')
    }))
    .pipe(gulpAssemble(assemble, {
      layout: 'default'
    }))
    .pipe(gulpif(isProduction, htmlmin({
      collapseWhitespace: true
    })))
    .pipe(extname())
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream())
})

gulp.task('scripts', function () {
  return browserify({
    entries: 'app/scripts/main.ts',
    debug: !isProduction
  }).plugin('tsify', {
    noImplicitAny: true,
    target: 'ES5'
  })
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist/scripts'))
    .pipe(browserSync.stream())
})

gulp.task('scripts:vendor', function () {
  return gulp.src(externals)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('dist/scripts'))
})

gulp.task('styles', function () {
  return gulp.src('app/styles/**/*.{sass,scss}')
    .pipe(plumber())
    .pipe(globbing({
      extensions: ['.scss']
    }))
    .pipe(sass({
      outputStyle: isProduction ? 'compressed': 'expanded'
    }))
    .pipe(autoprefixer())
    .pipe(gulp.dest('dist/styles'))
    .pipe(browserSync.stream())
})

gulp.task('images', function () {
  return gulp.src('app/images/**/*.{jpg,jpeg,png,gif,svg}')
    .pipe(imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/images'))
    .pipe(size({
      title: "images"
    }))
})

gulp.task('default', ['clean', 'version', 'templates', 'styles', 'scripts', 'scripts:vendor', 'fonts', 'images', 'content'], function () {
  browserSync.init({
    server: {
        baseDir: "./dist"
    },
    notify: true,
    open: true,
    logLevel: 'silent'
  })

  gulp.watch('app/templates/**/*.{hbs,yaml,json}', ['templates'])  
  gulp.watch('app/styles/**/*', ['styles'])
  gulp.watch('app/scripts/**/*', ['scripts'])
  gulp.watch('dist/**/*.html', reload())
})

gulp.task('build', ['clean', 'version', 'templates', 'styles', 'scripts', 'scripts:vendor', 'fonts', 'images', 'content'])

function string_src(filename, string) {
  var src = require('stream').Readable({ objectMode: true })
  src._read = function () {
    this.push(new File({ cwd: "", base: "", path: filename, contents: new Buffer(string) }))
    this.push(null)
  }
  return src
}