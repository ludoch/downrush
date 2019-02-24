const path = require('path');

module.exports = {
  entry: './src/midianweb.js',
  watch: false,
   devtool:  false,
  output: {
    filename: 'midianweb.js',
	 path: path.resolve(__dirname, '../web/midian/')
  },
  module: {
      rules: [
      {
        test: /\.(jsx)$/,
        exclude: /node_modules/,
        loader: "babel-loader",
   		query:
      	{
        	presets:['react']
      	}
      },
      { test: /\.handlebars$/, loader: 'handlebars-loader' }
    ]
  },
};