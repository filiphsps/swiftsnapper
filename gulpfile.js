'use strict';
let gulp = require('gulp'),
    //sourcemaps = require('gulp-sourcemaps'),
    //autoprefixer = require('gulp-autoprefixer'),
    tsc = require('gulp-typescript');

var tscProj = tsc.createProject('scripts/tsconfig.json');
const output = './www/';

gulp.task('default', ['typescript']);

gulp.task('typescript', (callback) => {
    var sourceTsFiles = ['./scripts/**/*.ts', './typings/'];
    var tsResult = gulp.src(sourceTsFiles)
        //.pipe(sourcemaps.init())
        .pipe(tsc(tscProj));

    tsResult.dts
        .pipe(gulp.dest(output + 'scripts'));

    return tsResult.js
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(output + 'scripts'));
});

gulp.task('scss', () => {
    return null;
    return gulp
        .src('./scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            errLogToConsole: true,
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(output + 'css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(browserSync.reload({
            stream: true
        }));
});