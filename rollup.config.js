import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';

export default [
  {
    input: './spho.js',
    output: [{file: './dist/index.js', format: 'cjs'}, {file: './dist/index.es.js', format: 'es'}],        
  },  
];