'use strict';

/**
 * @property options.external: external modules that don't need to be constantly re-compiled.
 * @property options.require: expose dependencies with alias.
 * @property options.browserifyOptions.debug: enable inline Source mapping (source map at the end of bundle), required with minifyify plugin.
 * @property options.plugin.minifyify.output: create json with debugging source map.
 * @property options.plugin.minifyify.map: append source map url at the end of bundle.
 * @constructor
 */
let _ = require('lodash'),
    utils = require('./../UtilsTask'),
    discReporter = require('./../DiscReporter'),
    SchemaBrowserOptions = [
        ['browserifyOptions', {
            debug: true
        }],
        ['transform', []],
        ['plugin', []],
        ['exclude', []],
        ['postBundleCB', function (err, src, next) {
            next(err, src);
        }]
    ],
    SchemaBrowserPlugin = [],
    SchemaBrowserTransform = [
        ['browserify-shim'],
        ['babelify', {
            'presets': ['es2015']
        }]
    ],
    vendors = {
        app: ['lodash', 'jquery'],
        test: ['lodash', 'jquery', 'chai', 'sinon']
    },
    BrowserifyOptions = function (options) {
        this.options = _.cloneDeep(new Map(SchemaBrowserOptions));
        this.src = options.src || new Set();
        this.dest = options.dest || '';
    };

_.assign(BrowserifyOptions.prototype, {
    setAllOriginSource: function () {
        this.src.clear();
        this.src.add('.');

        return this;
    },
    // reset this here because it's not needed
    avoidCompileVendors: function () {
        this.options.set('external', null);

        return this;
    },
    excludeSourceUnBundleScript: function () {
        let exclude = this.options.get('exclude');

        exclude.push('**/*.html', '**/*.css', '**.*.json');
        this.options.set('exclude', exclude);

        return this;
    },
    requireVendors: function (path) {
        this.options.set('external', _.get(vendors, path));

        return this;
    },
    disableSourceDebug: function () {
        let browser = this.options.get('browserifyOptions');

        browser.debug = false;
        this.options.set('browserifyOptions', browser);

        return this;
    },
    // when compile files using the command-line interface (like disc profile)
    setFullPathsBundle: function () {
        let browser = this.options.get('browserifyOptions');

        browser.fullPaths = true;
        this.options.set('browserifyOptions', browser);

        return this;
    },
    setDependencies: function (path) {
        this.options.set('require', _.get(vendors, path));

        return this;
    },
    postBundleOutputWithDisc: function (/*dir, file*/) {
        let browser = this.options.get('browserifyOptions'),
            disc = discReporter();

        browser.outputDisc = _.zipObject(['dir', 'file'], arguments);
        this.options.set('browserifyOptions', browser);
        this.options.set('postBundleCB', _.bind(disc.postBundleCB, disc));

        return this;
    },
    addOriginSource: function (path) {
        this.src.add(path);

        return this;
    },
    addCompiledSource: function (path) {
        this.dest = path;

        return this;
    },
    addMinifyWithSourceMap: function (path) {
        let plugins = SchemaBrowserPlugin.concat(['minifyify', {
            output: path + '/sourcemap.json',
            map: utils.getProyectPath(path + '/sourcemap.json')
        }]);

        this.options.set('plugin', plugins);

        return this;
    },
    addMinifyWithoutSourceMap: function () {
        let plugins = SchemaBrowserPlugin.concat(['minifyify', {
            map: false
        }]);

        this.options.set('plugin', plugins);

        return this;
    },
    addTransformTestBundle: function () {
        let transform = SchemaBrowserTransform.concat(['browserify-istanbul']);

        this.options.set('transform', transform);

        return this;
    },
    addTransformAppBundle: function () {
        this.options.set('transform', SchemaBrowserTransform);

        return this;
    },
    build: function () {
        return {
            options: utils.convert.strMapToObj(this.options),
            src: utils.convert.strSetToObj(this.src),
            dest: this.dest
        };
    }
});

module.exports.getOptions = function (options) {
    return new BrowserifyOptions(options || new Map());
};
