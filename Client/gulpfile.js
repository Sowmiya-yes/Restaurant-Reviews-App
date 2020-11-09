var gulp = require('gulp');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');
const babel = require('gulp-babel');

gulp.task('js', function(){
   gulp.src('js/*.js')
   .pipe(babel({
            presets: ['@babel/env']
        }))
   .pipe(uglify().on('error', function(e){
            console.log(e);
         }))
   
   .pipe(gulp.dest('build/scripts/'));
});

gulp.task('css', function(){
   gulp.src('css/*.css')
   .pipe(minify())
   .pipe(gulp.dest('build/styles/'));
});

gulp.task('default',['js','css'],function(){
});
