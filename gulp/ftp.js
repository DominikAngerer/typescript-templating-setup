var gulp = require('gulp');
var sftp = require('gulp-sftp');

gulp.task('ftp', function () {
    return gulp.src('dist/**/*')
        .pipe(sftp({
            host: '88.198.111.86',
            user: 'root',
            pass: 'S7B4yvmcnwwj59',
            remotePath: '/var/www/netural.com/dev/4321lkfazoifsada'
        }));
});
