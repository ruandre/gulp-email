'use strict'

const fs = require('fs')
const path = require('path')

const gulp = require('gulp')
const plumber = require('gulp-plumber')
const stylus = require('gulp-stylus')
const autoprefixer = require('gulp-autoprefixer')
const data = require('gulp-data')
const pug = require('gulp-pug')
const inlineCss = require('gulp-inline-css')
const replace = require('gulp-replace')
const beautify = require('gulp-jsbeautifier')
const lec = require('gulp-line-ending-corrector')
const through2 = require('through2')
const he = require('he')

const browserSync = require('browser-sync')
const server = browserSync.create()

const config = fs.readFileSync(path.join(__dirname, 'config.json'))

const src = './src'
const dist = './dist'

const errHandler = err => {
  console.error(err)
}

function copy() {
  return gulp.src(`${src}/copy/**/*`).pipe(gulp.dest(dist))
}

function inline() {
  return gulp
    .src(`${src}/styl/inline.styl`)
    .pipe(plumber({ errorHandler: errHandler }))
    .pipe(stylus({ compress: false }))
    .pipe(gulp.dest(dist))
}

function embed() {
  return gulp
    .src(`${src}/styl/embed.styl`)
    .pipe(plumber({ errorHandler: errHandler }))
    .pipe(stylus({ compress: false }))
    .pipe(autoprefixer())
    .pipe(gulp.dest(dist))
}

function html() {
  const embed = fs.readFileSync(`${dist}/embed.css`)

  const encode = (file, _, cb) => {
    if (file.isBuffer()) {
      const opts = { strict: true, allowUnsafeSymbols: true }
      const out = he.encode(file.contents.toString(), opts)
      file.contents = Buffer.from(out)
    }
    cb(null, file)
  }

  const beautifyOpts = {
    indent_size: 2,
    html: {
      wrap_line_length: 900,
      extra_liners: [],
      inline: ['a', 'strong', 'br'],
    },
  }

  return gulp
    .src(`${src}/pug/*.pug`)
    .pipe(plumber({ errorHandler: errHandler }))
    .pipe(data(_file => JSON.parse(config)))
    .pipe(pug())
    .pipe(inlineCss({ applyWidthAttributes: true, applyTableAttributes: true }))
    .pipe(beautify(beautifyOpts))
    .pipe(beautify.reporter({ verbosity: beautify.report.ALL }))
    .pipe(replace('<!-- embed -->', `<style>${embed}</style>`))
    .pipe(replace(' alt ', ' alt="" '))
    .pipe(replace(' href ', ' href="" '))
    .pipe(through2.obj(encode))
    .pipe(lec({ verbose: true, eolc: 'CRLF', encoding: 'utf8' }))
    .pipe(gulp.dest(dist))
}

function reload(done) {
  server.reload()
  done()
}

function serve(done) {
  server.init({ server: { baseDir: dist } })
  done()
}

function watch() {
  gulp.watch('src/**/*', gulp.series(copy, inline, embed, html, reload))
}

gulp.task('default', gulp.series(copy, inline, embed, html))
gulp.task('dev', gulp.series(copy, inline, embed, html, serve, watch))
