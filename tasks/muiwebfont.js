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

        var options = this.options({
            zipUrl: 'https://github.com/Templarian/WindowsIcons/archive/master.zip',
            svgEntry: 'WindowsIcons-master/WindowsPhone/svg',
            font: 'modernuiicons',
            size: 76,
            compression: {}
        });

        _.extend(options, {
            compressedEntry: 'svgmin',
            zipFileName: 'modernuiicons.zip',
            cacheDir: temp.mkdirSync()
        });

        grunt.file.mkdir(options.cacheDir);

        async.waterfall([
            downloadZip.bind(null, options),
            extractZip.bind(null, options),
            processSvg.bind(null, options)
        ], this.async());

        function downloadZip(options, next) {
            var zipPath = path.join(options.cacheDir, options.zipFileName);

            if (grunt.file.exists(zipPath)) {
                grunt.log.writeln(chalk.green(' + ') + 'Zip found. Skip downloading');
                next();
            } else {
                grunt.log.writeln('Downloading ' + options.zipUrl + '...');
                request.get(options.zipUrl)
                    .pipe(fs.createWriteStream(zipPath))
                    .on('close', function () {
                        grunt.log.writeln(chalk.green(' + ') + options.zipFileName + ' downloaded to ' + zipPath);
                        next();
                    })
                    .on('error', next);
            }
        }

        function extractZip(options, next) {
            try {
                var zipPath = path.join(options.cacheDir, options.zipFileName),
                    zip = new AdmZip(zipPath);

                grunt.log.writeln('Extracting files...');
                zip.extractAllTo(options.cacheDir, true);
                grunt.log.writeln(chalk.green(' + ') + options.zipFileName + ' extracted to ' + options.cacheDir);
                next();
            } catch (e) {
                next(e);
            }
        }

        function processSvg(options, next) {
            var processFn = require('../lib/svgmin');
            processFn(grunt, options, next);
        }

    });
};
