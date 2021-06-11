const assert = require('assert');
const transform = require('@babel/core').transform;
const plugin = require('./');

transform(`
const titleClass = [styles.title, {[styles.title2]: true}];
<div className={titleClass} />;
<div className={[a,b && fo]} />;
<div className={{title, disabled: good}} />;
classNames(a, b && foo);
<div className="hhi" />;
<div className={hhi} />;
<div className={good && hhi} />;
<div className={[a,b && fo].join('')} />;
`.trim(), {plugins: ['@babel/plugin-syntax-jsx', plugin]}, (err, result) => {
    if (err) {
        console.error(err);
        throw err;
    }
    console.log(123, result.code);
    assert.equal(
        result.code,
        `
import _classNames from "classnames";
<div className={_classNames(a, b && fo)} />;
<div className={_classNames({
  title,
  disabled: good
})} />;
classNames(a, b && foo);
<div className="hhi" />;
<div className={hhi} />;
<div className={[a, b && fo].join('')} />;
    `.trim(),
    );
});
//
// transform(`
// <div className={[a,b && fo]} />;
// `.trim(), {plugins: ['@babel/plugin-syntax-jsx', [plugin, {importName: 'cx'}]]}, (err, result) => {
//     if (err) {
//         throw err;
//     }
//     assert.equal(
//         result.code,
//         `
// import { cx as _classNames } from "classnames";
// <div className={_classNames(a, b && fo)} />;
//     `.trim(),
//     );
// });
//
// transform(`
// <div className={[a,b && fo]}><div className={[styles.foo]} /></div>;
// `.trim(), {presets: ['@babel/env'], plugins: ['@babel/plugin-syntax-jsx', plugin]}, (err, result) => {
//     if (err) {
//         throw err;
//     }
//
//     assert.equal(
//         result.code,
//         `
// "use strict";
//
// var _classnames = _interopRequireDefault(require("classnames"));
//
// function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//
// <div className={(0, _classnames.default)(a, b && fo)}><div className={(0, _classnames.default)(styles.foo)} /></div>;
// `.trim(),
//     );
// });
