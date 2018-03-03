var fs = require('fs');
var _ = require('lodash');
var minimist = require('minimist');

var argv = minimist(process.argv);

if (!argv.f || !argv.n || !argv.c) {
    console.log('Usage: node parser.js -f <fileName.css> -n <newFileName.css> -c <colors> (colors in hex format and comma separated)');
    console.log('Example: node parser.js -f theme.css -n colors.css -c #FFFFFF,#F2F2F2,#000000');
    process.exit()
}

var cssFile = argv.f;
var newCssFile = argv.n;
var cssFileContent = '';

let colors = _.split(argv.c, ',');

const regexMedia = /(@[^{]+{)([\s\S]+?})\s*}/gi;
const regexSelectors = '((.|,\n)*\{)([^\}|\{]*)\}';
const regexColors = '(^([^\\n]*)(' + _.join(colors, '|') + ')([^\\n]*)$)';


fs.readFile(cssFile, 'utf8', function (err, content) {
    // get media queryies and other modifiers
    var medias = content.match(regexMedia);
    content = content.replace(regexMedia, '');
    cssFileContent += processSelectors(content);
    cssFileContent += processMedias(medias);
    fs.writeFile(newCssFile, cssFileContent, function (err) {
        if (err) console.error(err);
        console.log('=========== DONE =========== ');
    });
});


var processSelectors = function (content) {
    var selectorsContent = '';
    const matches = content.match(new RegExp(regexSelectors, 'gim'));
    _.each(matches, function (match) {
        var regexSelector = new RegExp(regexSelectors, 'gim');
        var match = (regexSelector).exec(match);
        if (match) {
            var toWrite = writeable({selector: match[1], content: match[3]});
            if (toWrite !== false) selectorsContent += toWrite;
        }
    });

    return (selectorsContent !== '') ? selectorsContent : false;
};


var processMedias = function (medias) {
    var mediaContent = '';
    _.each(medias, function (media) {
        var media = (regexMedia).exec(media);
        var mediaWrite = '';
        if (media) {
            var selectorsWrite = processSelectors(media[0]);
            if (selectorsWrite && media[1]) {
                mediaWrite += media[1] + '\n';
                mediaWrite += selectorsWrite;
                mediaWrite += '\n}\n';
            }
        }
        if (mediaWrite !== '') mediaContent += mediaWrite;
    });
    return mediaContent;
};


var writeable = function (selector) {
    var content = '';
    if (selector.selector) {
        var toWrite = filterColors(selector.content);
        if (toWrite !== false) {
            content = selector.selector + '\n';
            content += toWrite;
            content += '\n}\n';
        }
    }
    return (content !== '') ? content : false;
};


var filterColors = function (content) {

    var colorsContent = '';
    const matches = content.match(RegExp(regexColors, 'gmi'));
    _.each(matches, function (match) {
        var regexColor = new RegExp(regexColors, 'gmi');
        var match = (regexColor).exec(match);
        if (match) {
            colorsContent += match[0];
        }
    });
    return (colorsContent !== '') ? colorsContent : false;
};