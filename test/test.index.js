process.env.NODE_ENV = 'test';

var should = require('should');
var Manifest = require('../index');
var m = new Manifest();
var common;

describe('validate', function () {
  beforeEach(function () {
    common = {
      description: 'test app',
      name: 'app'
    };
  });

  it('should return an invalid manifest object', function () {
    try {
      var results = m.validate('');
    } catch (err) {
      err.toString().should.equal('Error: Manifest is not in a valid JSON format or has invalid properties');
    }
  });


  it('should return an invalid manifest with missing mandatory keys for the marketplace', function () {
    var results = m.validate({});

    ['name', 'description', 'developer'].forEach(function (f) {
      var currKey = results.errors['MandatoryField' + f.charAt(0).toUpperCase() + f.slice(1)];
      currKey.toString().should.equal('Error: Mandatory field ' + f + ' is missing');
    });
  });

  it('should return an invalid manifest with missing mandatory keys for non-marketplace', function () {
    content = '{}';
    m.appType = '';
    var results = m.validate(content);

    ['name', 'description'].forEach(function (f) {
      var currKey = results.errors['MandatoryField' + f.charAt(0).toUpperCase() + f.slice(1)];
      currKey.toString().should.equal('Error: Mandatory field ' + f + ' is missing');
      should.not.exist(results.errors.MandatoryFieldDeveloper);
    });
  });

  it('should return an invalid manifest for duplicate fields', function () {
    common.activities = '1';
    common.activities = '2';

    try {
      var results = m.validate(common);
    } catch (err) {
      err.toString().should.equal('Error: Manifest is not in a valid JSON format or has invalid properties');
    }
  });

  it('should return an invalid property type', function () {
    common.launch_path = [];

    var results = m.validate(common);
    results.errors['InvalidPropertyTypeLaunchPath'].toString().should.equal(
      "Error: `launch_path` must be of type `string`");
  });

  it('should return an invalid launch path', function () {
    common.launch_path = '//';

    var results = m.validate(common);

    results.errors['InvalidLaunchPath'].toString().should.equal("Error: `launch_path` must be a path relative to app's origin");
  });

  it('should return a valid launch path', function () {
    common.launch_path = '/';

    var results = m.validate(common);

    should.not.exist(results.errors['InvalidLaunchPath']);
  });

  it('should have an invalid icon size and invalid icon path', function () {
    common.icons = {
      a: ''
    };

    var results = m.validate(common);

    results.errors['InvalidIconSizeA'].toString().should.equal(
      'Error: Icon size must be a natural number');
    results.errors['InvalidIconPathA'].toString().should.equal(
      'Error: Paths to icons must be absolute paths, relative URIs, or data URIs');
  });

  it('should have a valid icon size and valid icon path', function () {
    common.icons = {
      '128': '/path/to/icon.png'
    };

    var results = m.validate(common);

    should.not.exist(results.errors['InvalidIconSize128']);
    should.not.exist(results.errors['InvalidIconPath128']);
  });

  it('should have an invalid length if a minLength is provided', function () {
    common.default_locale = '';

    var results = m.validate(common);

    results.errors['InvalidPropertyLengthDefaultLocale'].toString().should.equal(
      'Error: `default_locale` must not be empty');
  });

  it('should have a valid length if a minLength is provided', function () {
    common.default_locale = 'en';

    var results = m.validate(common);

    should.not.exist(results.errors['InvalidPropertyLengthDefaultLocale']);
  });

  it('should have an invalid length if a maxLength is provided', function () {
    common.name = Array(130).join('x');

    var results = m.validate(common);

    results.errors['InvalidPropertyLengthName'].toString().should.equal(
      'Error: `name` must not exceed length 128');
  });

  it('should have a valid length if a maxLength is provided', function () {
    common.name = 'my app';

    var results = m.validate(common);

    should.not.exist(results.errors['InvalidPropertyLengthName']);
  });

  it('should have an invalid developer name if empty', function () {
    common.developer = {
      'name': ''
    };

    var results = m.validate(common);

    results.errors['InvalidPropertyLengthDeveloperName'].toString().should.equal('Error: `name` must not be empty');
  });

  it('should have an invalid developer name if not string', function () {
    common.developer = {
      'name': {
        'I have': 'no idea what I am doing'
      }
    };

    var results = m.validate(common);

    results.errors['InvalidPropertyTypeDeveloperName'].toString().should.equal('Error: `name` must be of type `string`');
  });

  it('should have an invalid developer property if name is missing', function () {
    common.developer = {};

    var results = m.validate(common);

    results.errors['MandatoryFieldDeveloperName'].toString().should.equal('Error: Mandatory field name is missing');
  });

  it('should have an invalid developer url error if url invalid', function () {
    common.developer = {
      name: 'Doge',
      url: 'foo'
    };
    var results = m.validate(common);
    results.errors['InvalidDeveloperUrl'].toString().should.equal('Error: Developer URL must be an absolute HTTP or HTTPS URL');
  });

  it('should have no error for an unexpected developer property', function () {
    common.developer = {
      name: 'doge',
      yo: 'doge'
    };
    (function () {
      var results = m.validate(common);
    }).should.not.throw();
  });

  it('should have an invalid version', function () {
    common.version = 'v1.0!!';

    var results = m.validate(common);

    results.errors['InvalidVersion'].toString().should.equal(
      'Error: `version` is in an invalid format.');
  });

  it('should have a valid version', function () {
    common.version = 'v1.0';

    var results = m.validate(common);

    should.not.exist(results.errors['InvalidVersion']);
  });

  it('should have an invalid string type for oneOf', function () {
    common.role = 'test';

    var results = m.validate(common);

    results.errors['InvalidStringTypeRole'].toString().should.equal(
      'Error: `role` must be one of the following: system,input,homescreen');
  });

  it('should have a valid string type for oneOf', function () {
    common.role = 'system';

    var results = m.validate(common);

    should.not.exist(results.errors['InvalidStringTypeRole']);
  });

  it('should have an invalid string type for anyOf', function () {
    common.orientation = 'test';

    var results = m.validate(common);

    results.errors['InvalidStringTypeOrientation'].toString().should.equal(
      'Error: `orientation` must be any of the following: portrait,landscape,' +
      'portrait-secondary,landscape-secondary,portrait-primary,landscape-primary');
  });

  it('should have a valid string type for anyOf', function () {
    common.orientation = 'portrait, landscape';

    var results = m.validate(common);

    should.not.exist(results.errors['InvalidStringTypeOrientation']);
  });

  it('should have an invalid default_locale', function () {
    common.locales = {
      'es': {}
    };

    var results = m.validate(common);

    results.errors['InvalidDefaultLocale'].toString().should.equal(
      'Error: `default_locale` must match one of the keys in `locales`');
  });

  it('should have a valid default_locale', function () {
    common.locales = {
      'es': {}
    };

    common.default_locale = 'es';

    var results = m.validate(common);

    should.not.exist(results.errors['InvalidDefaultLocale']);
  });

  it("should be valid when installs_allowed_from is an array", function () {
    common.installs_allowed_from = [
      'https://apps.lmorchard.com'
    ];
    var results = m.validate(common);
    should.not.exist(results.errors['InvalidPropertyTypeInstallsAllowedFrom']);
  });

  it("should be valid when installs_allowed_from contains a wildcard", function () {
    common.installs_allowed_from = [
      '*'
    ];
    var results = m.validate(common);
    should.not.exist(results.errors['InvalidUrlInstallsAllowedFrom']);
  });

  it("should have an invalid type for installs_allowed_from when not an array", function () {
    common.installs_allowed_from = "THIS IS NOT A LIST";
    var results = m.validate(common);
    results.errors['InvalidPropertyTypeInstallsAllowedFrom'].toString().should.equal(
      'Error: `installs_allowed_from` must be of type `array`');
  });

  it("should have an invalid error for installs_allowed_from when any array item is not a string", function () {
    common.installs_allowed_from = [
      {
        this: 'is not a string'
      }
    ];
    var results = m.validate(common);
    results.errors['InvalidArrayOfStringsInstallsAllowedFrom'].toString().should.equal(
      'Error: `installs_allowed_from` must be an array of strings');
  });

  it("should be invalid when installs_allowed_from is present but empty", function () {
    common.installs_allowed_from = [];
    var results = m.validate(common);
    results.errors['InvalidEmptyInstallsAllowedFrom'].toString().should.equal(
      'Error: `installs_allowed_from` cannot be empty when present');
  });

  it("should be invalid when installs_allowed_from list contains an invalid URL", function () {
    common.installs_allowed_from = [
      'foo/bar'
    ];
    var results = m.validate(common);
    results.errors['InvalidUrlInstallsAllowedFrom'].toString().should.equal(
      'Error: `installs_allowed_from` must be a list of valid absolute URLs or `*`');
  });

  it("should be invalid when installs_allowed_from has no marketplace URLs but listed is true", function () {
    common.installs_allowed_from = [
      'https://apps.lmorchard.com'
    ];
    var results = m.validate(common, {listed: true});
    results.errors['InvalidListedRequiresMarketplaceUrlInstallsAllowedFrom'].toString().should.equal(
      'Error: `installs_allowed_from` must include a Marketplace URL when app is listed');
  });

  it("should be invalid when installs_allowed_from has no Marketplace URLs, but listed is true", function () {
    common.listed = true;
    common.installs_allowed_from = [
      "https://marketplace.firefox.com",
      'https://apps.lmorchard.com'
    ];
    var results = m.validate(common);
    should.not.exist(results.errors['InvalidListedRequiresMarketplaceUrlInstallsAllowedFrom']);
  });

  it("should be invalid when installs_allowed_from contains a Marketplace URL with http", function () {
    common.installs_allowed_from = [
      "http://marketplace.firefox.com",
    ];
    var results = m.validate(common);
    results.errors['InvalidSecureMarketplaceUrlInstallsAllowedFrom'].toString().should.equal(
      'Error: `installs_allowed_from` must use https:// when Marketplace URLs are included');
  });

  it("should be invalid when screen_size is not an object", function () {
    common.screen_size = 'NOT AN OBJECT';
    var results = m.validate(common);
    results.errors['InvalidPropertyTypeScreenSize'].toString().should.equal(
      "Error: `screen_size` must be of type `object`");
  });

  it("should be invalid when screen_size is an empty object", function () {
    common.screen_size = {};
    var results = m.validate(common);
    results.errors['InvalidEmptyScreenSize'].toString().should.equal(
      'Error: `screen_size` should have at least min_height or min_width');
  });

  it("should be valid when screen_size.min_width is a number", function () {
    common.screen_size = {
      min_width: '640'
    };
    var results = m.validate(common);
    should.not.exist(results.errors['InvalidNumberScreenSizeMinWidth']);
  });

  it("should be invalid when screen_size.min_width is not a number", function () {
    common.screen_size = {
      min_width: 'NOT A NUMBER'
    };
    var results = m.validate(common);
    results.errors['InvalidNumberScreenSizeMinWidth'].toString().should.equal(
      "Error: `min_width` must be a number");
  });

  it("should be valid when screen_size.min_height is a number", function () {
    common.screen_size = {
      min_height: '480'
    };
    var results = m.validate(common);
    should.not.exist(results.errors['InvalidNumberScreenSizeMinHeight']);
  });

  it("should be invalid when screen_size.min_height is not a number", function () {
    common.screen_size = {
      min_height: 'NOT A NUMBER'
    };
    var results = m.validate(common);
    results.errors['InvalidNumberScreenSizeMinHeight'].toString().should.equal(
      "Error: `min_height` must be a number");
  });

  it('should be valid when type is one of the expected values', function () {
    ['web', 'privileged', 'certified'].forEach(function (type) {
      common.type = type;
      var results = m.validate(common);
      should.not.exist(results.errors['InvalidStringTypeType']);
    });
  });

  it('should be invalid when type is not one of web, privileged, or certified', function () {
    common.type = 'bonafide';
    var results = m.validate(common);
    results.errors['InvalidStringTypeType'].toString().should.equal(
      'Error: `type` must be one of the following: web,privileged,certified');
  });

  it("should be invalid when type is not a string", function () {
    common.type = ['NOT', 'A', 'STRING'];
    var results = m.validate(common);
    results.errors['InvalidPropertyTypeType'].toString().should.equal(
      'Error: `type` must be of type `string`');
  });

  it('should be invalid when type is certified but app is listed', function () {
    common.type = 'certified';
    var results = m.validate(common, {listed: true});
    results.errors['InvalidTypeCertifiedListed'].toString().should.equal(
      'Error: `certified` apps cannot be listed');
  });

  it('should be invalid when type is not web but app is not packaged', function () {
    common.type = 'privileged';
    var results = m.validate(common, {packaged: false});
    results.errors['InvalidTypeWebPrivileged'].toString().should.equal(
      'Error: unpackaged web apps may not have a type of `certified` or `privileged`');
  });

  it('should be valid when fullscreen is "true" or "false"', function () {
    ['true', 'false'].forEach(function (val) {
      common.fullscreen = val;
      var results = m.validate(common);
      should.not.exist(results.errors['InvalidStringTypeFullscreen']);
    });
  });

  it('should be invalid when fullscreen is not "true" or "false"', function () {
    common.fullscreen = 'maybe';
    var results = m.validate(common);
    results.errors['InvalidStringTypeFullscreen'].toString().should.equal(
      'Error: `fullscreen` must be one of the following: true,false');
  });

  it('should be invalid when fullscreen is not a string', function () {
    common.fullscreen = ['NOT', 'A', 'STRING'];
    var results = m.validate(common);
    results.errors['InvalidPropertyTypeFullscreen'].toString().should.equal(
      'Error: `fullscreen` must be of type `string`');
  });

  it('should be valid when redirects is an array of objects with expected properties', function () {
    common.redirects = [
      {"to": "asdf", "from": "qwer"},
      {"to": "asdf", "from": "qwer"},
    ];
    var results = m.validate(common);
    should.not.exist(results.errors['InvalidPropertyTypeRedirects']);
    should.not.exist(results.errors['InvalidItemTypeRedirects']);
    should.not.exist(results.errors['UnexpectedPropertyRedirects']);
  });

  it('should be invalid when redirects is not an array', function () {
    common.redirects = 'NOT AN ARRAY';
    var results = m.validate(common);
    results.errors['InvalidPropertyTypeRedirects'].toString().should.equal(
      'Error: `redirects` must be of type `array`');
  });

  it('should be invalid when redirects is not an array of objects', function () {
    common.redirects = [
      'asdf',
      {"to": "asdf", "from": "qwer"}
    ];
    var results = m.validate(common);
    results.errors['InvalidItemTypeRedirects'].toString().should.equal(
      'Error: items of array `redirects` must be of type `object`');
  });

  it('should be invalid when redirects is not an array of objects with string values', function () {
    common.redirects = [
      {
        "to": ["NOT", "A", "STRING"],
        "from": "qwer"
      }
    ];
    var results = m.validate(common);
    results.errors['InvalidPropertyTypeRedirectsTo'].toString().should.equal(
      'Error: `to` must be of type `string`');
  });

  it('should be invalid when redirect items have unexpected properties', function () {
    common.redirects = [
        {"bar": "asdf", "foo": "qwer"},
        {"to": "asdf", "from": "qwer"}
    ];
    var results = m.validate(common);
    results.errors['UnexpectedPropertyRedirects'].toString().should.equal(
      'Error: Unexpected property `foo` found in `redirects`');
  });

  it('should be valid when chrome is an object with a boolean navigation property', function () {
    [true, false].forEach(function (val) {
      common.chrome = {
        navigation: val
      };
      var results = m.validate(common);
      should.not.exist(results.errors['InvalidPropertyTypeChrome']);
      should.not.exist(results.errors['InvalidChromeProperties']);
      should.not.exist(results.errors['UnexpectedPropertyChrome']);
    });
  });

  it('should be invalid when chrome is not an object', function () {
    common.chrome = ['NOT', 'AN', 'OBJECT'];
    var results = m.validate(common);
    results.errors['InvalidPropertyTypeChrome'].toString().should.equal(
      'Error: `chrome` must be of type `object`');
  });

  it('should be invalid when chrome.navigation is not boolean', function () {
    common.chrome = {
      navigation: 'woofwoof'
    };
    var results = m.validate(common);
    results.errors['InvalidPropertyTypeChromeNavigation'].toString().should.equal(
      'Error: `navigation` must be of type `boolean`');
  });

  it('should be invalid when chrome is an object with unexpected properties', function () {
    common.chrome = {
      shiny: true
    };
    var results = m.validate(common);
    results.errors['UnexpectedPropertyChrome'].toString().should.equal(
      'Error: Unexpected property `shiny` found in `chrome`');
  });

});
