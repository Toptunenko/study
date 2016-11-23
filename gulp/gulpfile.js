const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');
const del = require('del');
const newer = require('gulp-newer');
const remember = require('gulp-remember');
const path = require('path');
const browserSync = require('browser-sync').create();
const through2 = require('through2').obj;
const file = require('vinyl');
const fs = require('fs');
const eslint = require('gulp-eslint');
const combiner = require('stream-combiner2');

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV == 'dev';

gulp.task('style', function () {

    const mtimes = {};

    return gulp.src('frontend/styles/main.scss', {base: 'frontend'})
        .pipe(gulpIf(isDev, sourcemaps.init()))
        .pipe(remember('styles'))
        .pipe(sass())
        .pipe(gulpIf(isDev, sourcemaps.write()))
        .pipe(through2(
            function (file, enc, callback) {
                mtimes[file.relative] = file.stat.mtime;
                callback(null, file)
            },
            function (callback) {
                let manifest = new file({
                    contents: new Buffer(JSON.stringify(mtimes)),
                    base: process.cwd(),
                    path: process.cwd() + '/manifest.json'
                });
                this.push(manifest);
                callback();
            }
        ))
        .pipe(gulp.dest('public'))
});

gulp.task('clean', function () {
    return del('public');
});

gulp.task('assets', function () {
   return gulp.src('frontend/assets/**', {since: gulp.lastRun('assets')})
       .pipe(newer('public'))
       .pipe(gulp.dest('public'));
});

gulp.task('watch', function () {
    gulp.watch('frontend/styles/**/*.*', gulp.series('style')).on('unlink', function (filepath) {
        remember.forget('styles', path.resolve(filepath));
    });
    gulp.watch('frontend/assets/**/*.*', gulp.series('assets'));
});

gulp.task('default', gulp.series(
    'clean',
    gulp.parallel('style', 'assets')
));

gulp.task('serve', function () {
    browserSync.init({
        server: "public"
    });

    browserSync.watch('public/**/*.*').on('change', browserSync.reload);
});

// gulp.task('lint', function () {
//
//     let eslintResult = {};
//     let cacheFile = process.cwd() + '/tmp/lintCache.json';
//
//     try {
//         eslintResult = JSON.parse(fs.readFileSync(cacheFile));
//     } catch(e) {
//     }
//
//
//     return gulp.src('frontend/**/*.js')
//         .pipe(gulpIf(
//
//             through2(
//                function (file) {
//                 return eslintResult[file.path] && eslintResult[file.path].mtime == file.stat.mtime.toJSON();
//             }, function (file, enc, callback) {
//                     file.eslint = eslintResult[file.path].eslint;
//                     callback(null, file);
//                 }
//             ),
//             combiner(
//                 through2(
//                     function (file, enc, callback) {
//                         file.content = fs.readFileSync(file.path);
//                         callback(null, file);
//                     }
//                 ),
//                 eslint(),
//                 through2(
//                     function (file, enc, callback) {
//                         eslintResult[file.path] = {
//                             eslint: file.eslint,
//                             mtime: file.stat.mtime
//                         };
//                         callback(null, file);
//                     }
//                 ),
//             )
//         ))
//         .pipe(eslint.format())
//         .on('end', function () {
//             fs.writeFileSync(cacheFile, JSON.stringify(eslintResult))
//         });
// });


gulp.task('lint', function () {

    let eslintResult = {};
    let cacheFile = process.cwd() + '/tmp/lintCache.json';

    try {
        eslintResult = JSON.parse(fs.readFileSync(cacheFile));
    } catch(e) {
    }

    return gulp.src('frontend/**/*.js')
        .pipe(gulpIf(
            function (file) {
                return eslintResult[file.path] && eslintResult[file.path].mtime == file.stat.mtime.toJSON();
            },
            through2(
                function (file, enc, callback) {
                    file.eslint = eslintResult[file.path].eslint;
                    callback(null, file);
                }
            ),
            combiner(
                eslint()
            )
        ));
});

gulp.task('dev', gulp.series('default', gulp.parallel('watch', 'serve')));



