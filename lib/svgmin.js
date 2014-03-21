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
    SVGO = require('svgo'),
    chalk = require('chalk'),
    eachAsync = require('each-async'),
    prettyBytes = require('pretty-bytes');

module.exports = function (grunt, options, next) {
    var svgSrcPattern = path.join(options.cacheDir, options.svgEntry, '*.svg'),
        svgo = new SVGO(options.compression),
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
            grunt.file.write(path.join(options.destSvg, fName), result.data);
            next();
        });

    }, next);

    grunt.log.writeln(chalk.green(' ✓ ') + 'Total saved: ' + chalk.green(prettyBytes(totalSaved)));
};
