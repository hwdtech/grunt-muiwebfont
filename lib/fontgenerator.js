/**
 * Copyright (C) 2011-2014 Limited Liability Company "Tik-Tok Coach"
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for
 * the specific language governing permissions and limitations under the License.
 */

'use strict';

var path = require('path');
var fs = require('fs');
var async = require('async');
var svgicons2svgfont = require('svgicons2svgfont');
var svg2ttf = require('svg2ttf');
var ttf2eot = require('ttf2eot');
var ttf2woff = require('ttf2woff');

module.exports = function (grunt, o, next) {
    var files = grunt.file.expand(path.join(o.cacheDir, o.compressedEntry, '*.svg')),
        startCodepoint = 0xE001;

    o.glyphs = files.map(function (file) {
        return path.basename(file, '.svg').replace(/\./g, '-');
    });

    o.codepoints = o.glyphs.map(function (glyph, idx) {
        return (startCodepoint + idx).toString(16);
    });

    function getFontPath(type) {
        return path.join(o.destDir, o.fontName + '.' + type);
    }

    function generateSvgFont(done) {
        svgicons2svgfont(files.map(function (file, idx) {
            return {
                stream: fs.createReadStream(file),
                name: o.glyphs[idx],
                codepoint: parseInt(o.codepoints[idx], 16)
            };
        }), {
            fontName: o.fontName,
            fontHeight: o.size,
            log: grunt.log.writeln,
            error: grunt.log.fail
        })
            .pipe(fs.createWriteStream(getFontPath('svg')))
            .on('finish', done)
            .on('error', done);
    }

    function generateFonts(done) {
        var svg = grunt.file.read(getFontPath('svg')),
            ttf = new Buffer(svg2ttf(svg, {}).buffer),
            ttfArr = new Uint8Array(ttf);

        grunt.file.write(getFontPath('ttf'), ttf);
        grunt.file.write(getFontPath('eot'), new Buffer(ttf2eot(ttfArr).buffer));
        grunt.file.write(getFontPath('woff'), new Buffer(ttf2woff(ttfArr, {}).buffer));
        done();
    }

    async.series([
        generateSvgFont,
        generateFonts
    ], next);
};
