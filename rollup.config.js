import packageJson from './package.json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
const htmlTemplate = require('rollup-plugin-generate-html-template')

import babel from '@rollup/plugin-babel'
import url from '@rollup/plugin-url'
import copy from 'rollup-plugin-copy'
//import { string } from 'rollup-plugin-string'

import dev from 'rollup-plugin-dev'
//const serve = require('rollup-plugin-serve')
const livereload = require('rollup-plugin-livereload')

const { terser } = require('rollup-plugin-terser')
import { rollupPluginSpglsl } from 'spglsl'
import replace from '@rollup/plugin-replace'

let extensions = ['.ts', '.tsx']
export default args => {
  let prod = args['config-prod']
  return {
    input: 'src/main.ts',
    output: {
      format: 'iife', 
      name: 'Space',
      dir: 'dist',
      ...(prod ? {
        entryFileNames: '[name].min.js',
        plugins: [terser()]
      } : {
        sourcemap: true
      })
    },
    watch: {
      clearScreen: false
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          '__VERSION__': packageJson.version,
          '__DEV__': !prod
        }
      }),
      nodeResolve({ extensions, browser: true }),
      babel({ extensions, babelHelpers: 'bundled' }),
      copy({
        targets: [
        //  { src: 'assets/vsound.min.js', dest: 'dist' }
        ]
      }),
      rollupPluginSpglsl({ compileMode: 'Optimize', minify : true, mangleTwoPasses: true }),
      /*
      string({
        include: ['src/webgl/*.frag', 'src/webgl/*.vert']
      }),
      */
      url({ limit: 1000 }),
      htmlTemplate({
        template: 'src/index.html',
        target: 'index.html'
      }),
      ...(prod ? [] : [
        //serve({ contentBase: 'dist', port: 3000 }),
        dev({dirs: ['dist'], host: '0.0.0.0', port: 3000 }),
        livereload({ watch: 'dist', port: 8080 })
      ])
    ]
  }
}
