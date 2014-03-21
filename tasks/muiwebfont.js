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

var path = require('path'),
    chalk = require('chalk'),
    request = require('request'),
    temp = require('temp'),
    fs = require('fs'),
    AdmZip = require('adm-zip'),
    async = require('async'),
    _ = require('lodash'),
    SVGO = require('svgo'),
    eachAsync = require('each-async'),
    prettyBytes = require('pretty-bytes');

module.exports = function (grunt) {

    grunt.registerMultiTask('muiwebfont', 'Download, minify and generate webfonts', function () {
        this.requiresConfig([this.name, this.target, 'dest'].join('.'));

        var o = this.options({
                fontName: 'modernuiicons',
                rename: path.basename,
                size: 76,
                cacheDir: temp.mkdirSync()
            }),
            p = this.data;

        _.extend(o, {
            zipUrl: 'https://github.com/Templarian/WindowsIcons/archive/master.zip',
            svgEntry: 'WindowsIcons-master/WindowsPhone/svg',
            compressedEntry: 'svgmin',
            zipFileName: 'modernuiicons.zip',
            destDir: this.files[0].dest,
            destSvg: p.destSvg || 'images/svg',
            destScss: p.destScss || 'styles/'
        });

        grunt.file.mkdir(o.cacheDir);
        grunt.file.mkdir(o.destDir);

        async.waterfall([
            downloadZip,
            extractZip,
            processSvg,
            generateFont,
            generateScss
        ], this.async());

        function downloadZip(done) {
            var zipPath = path.join(o.cacheDir, o.zipFileName);

            if (grunt.file.exists(zipPath)) {
                grunt.log.writeln(chalk.green(' ✓ ') + 'Zip found. Skip downloading.');
                done();
            } else {
                grunt.log.writeln('Downloading ' + o.zipUrl + '...');
                request.get(o.zipUrl)
                    .pipe(fs.createWriteStream(zipPath))
                    .on('close', function () {
                        grunt.log.writeln(chalk.green(' ✓ ') + o.zipFileName + ' downloaded to ' + zipPath);
                        done();
                    })
                    .on('error', done);
            }
        }

        function extractZip(done) {
            try {
                if (grunt.file.exists(path.join(o.cacheDir, o.svgEntry))) {
                    grunt.log.writeln('Svg icons found. Skip extraction.');
                } else {
                    var zipPath = path.join(o.cacheDir, o.zipFileName),
                    zip = new AdmZip(zipPath);
                    grunt.log.writeln('Extracting files...');
                    zip.extractAllTo(o.cacheDir, true);
                    grunt.log.writeln(chalk.green(' ✓ ') + o.zipFileName + ' extracted to ' + o.cacheDir);
                }
                done();
            } catch (e) {
                done(e);
            }
        }

        function processSvg(done) {
            var svgSrcPattern = path.join(o.cacheDir, o.svgEntry, '*.svg'),
                svgo = new SVGO(),
                totalSaved = 0;

            eachAsync(grunt.file.expand(svgSrcPattern), function (src, i, next) {
                var svg = grunt.file.read(src),
                    fName = path.basename(src);

                svg = svg.replace(/viewBox="[\d\s\.]+"/, '')
                    .replace(/enable\-background="new[\d\s\.]+"/, '');

                svgo.optimize(svg, function (result) {
                    if (result.error) {
                        return grunt.warn('Error parsing SVG: ' + result.error);
                    }

                    totalSaved += svg.length - result.data.length;
                    grunt.file.write(path.join(o.destSvg, fName), result.data);
                    next();
                });

            }, done);

            grunt.log.writeln(chalk.green(' ✓ ') + 'Total saved: ' + chalk.green(prettyBytes(totalSaved)));
        }

        function generateFont(done) {
            var generatorFn = require('./lib/fontgenerator');
            generatorFn(grunt, o, done);
        }

        function generateScss(done) {
            var template = grunt.file.read(path.join(__dirname, 'templates', 'style.tpl')),
                scss;

            o.glyphs = o.glyphs.map(function (str) {
                return str.trim().replace(/\s+/g, '-');
            });

            scss = grunt.template.process(template, { data: {
                glyphs: o.glyphs,
                codepoints: o.codepoints,
                fontName: o.fontName,
                fontSize: o.fontSize
            }});

            grunt.file.write(o.destScss, scss);
            done();
        }

    });
};
