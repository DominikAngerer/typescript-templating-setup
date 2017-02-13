var gulp = require('gulp');

gulp.task('build', ['clean', 'templates', 'fonts', 'icons', 'vendor', 'scripts', 'images']);
