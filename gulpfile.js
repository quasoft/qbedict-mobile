var
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  rename = require('gulp-rename'),
  map = require('vinyl-map'),
  convertEncoding = require('gulp-convert-encoding'),
  string = require('string'),
  remoteSrc = require('gulp-remote-src'),
  runSequence = require('run-sequence');

var encoding = "ucs2";

gulp.task('update-bgen', function () {
  var bgen = [];
  for (var i = 1; i <= 32; i++) {
    bgen.push("d" + string(i).padLeft(2, "0") + ".txt");
  }
  return remoteSrc(bgen, {
      base: 'http://sourceforge.net/p/bgoffice/code/HEAD/tree/trunk/dictionaries/data/bg-en/',
      qs: { format: 'raw' }
    })
    .pipe(gulp.dest('./bgoffice/bg-en/'));
});

gulp.task('update-enbg', function () {
  var enbg = [];
  for (var i = 1; i <= 26; i++) {
    enbg.push("d" + string(i).padLeft(2, "0") + ".txt");
  }
  return remoteSrc(enbg, {
      base: 'http://sourceforge.net/p/bgoffice/code/HEAD/tree/trunk/dictionaries/data/en-bg/',
      qs: { format: 'raw' }
    })
    .pipe(gulp.dest('./bgoffice/en-bg/'));
});

gulp.task('update-data', function (callback) {
  runSequence(
    'update-bgen',
    'update-enbg',
    callback
  );
});

gulp.task('convert-data', function () {
  var textToJSON2 = map(function(code, filename) {
    code = code.toString(encoding);
    var out = "";
    var lines = code.split('\n');
    var items = [];
    var item = {};
    var isWord = true;
    var isFirst = false;

    for(var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (!line) {
        if (!isWord) {
          items.push(item);
          item = {};
          isWord = true;
          isFirst = false;
        }
        continue;
      }

      if (isWord) {
        // word
        item["w"] = line;

        isWord = false;
        isFirst = true;
      }
      else {
        if (isFirst && string(line).startsWith("[")) {
          // transcript
		  var tr = string(line)
			.replaceAll('§','ʌ')
			.replaceAll('a:','ɑ:')
			.replaceAll('Ў','æ')
			.replaceAll('ў','ə')
			.replaceAll('¦','ʃ')
			.replaceAll('Ґ','θ')
			.replaceAll('¤','ŋ')
			.replaceAll('­','ð')
			.replaceAll('Ј','ɔ')
			.replaceAll('©','ʒ')
			.replaceAll('u','ʊ')
			.replaceAll('Ё','e').s;
		  item["t"] = tr;
          continue;
        }

        if (isFirst) {
          isFirst = false;
        }

        // meaning
        if (!item["m"])
          item["m"] = "";
        item["m"] += line + "\r\n";
      }
    }

    return JSON.stringify(items);
  });

  return gulp.src(['./bgoffice/**/d*.txt'])
    .pipe(convertEncoding({from: 'win1251', to: encoding}))
    .pipe(textToJSON2)
    .pipe(rename({extname: ".json"}))
    .pipe(gulp.dest('./www/data/'));
});

gulp.task('default', function(callback) {
  runSequence(
    'convert-data',
    callback
  );
});
