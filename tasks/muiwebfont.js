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
    _ = require('lodash');

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
            downloadZip.bind(null, o),
            extractZip.bind(null, o),
            processSvg.bind(null, o),
            generateFont.bind(null, o)
        ], this.async());

        function downloadZip(o, next) {
            var zipPath = path.join(o.cacheDir, o.zipFileName);

            if (grunt.file.exists(zipPath)) {
                grunt.log.writeln(chalk.green(' ✓ ') + 'Zip found. Skip downloading.');
                next();
            } else {
                grunt.log.writeln('Downloading ' + o.zipUrl + '...');
                request.get(o.zipUrl)
                    .pipe(fs.createWriteStream(zipPath))
                    .on('close', function () {
                        grunt.log.writeln(chalk.green(' ✓ ') + o.zipFileName + ' downloaded to ' + zipPath);
                        next();
                    })
                    .on('error', next);
            }
        }

        function extractZip(o, next) {
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
                next();
            } catch (e) {
                next(e);
            }
        }

        function processSvg(o, next) {
            var processFn = require('../lib/svgmin');
            processFn(grunt, o, next);
        }

        function generateFont(o, next) {
            var generatorFn = require('../lib/fontgenerator');
            generatorFn(grunt, o, next);
        }

    });
};
