module.exports = function(grunt){
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		cssmin:{
			css:{
				src: "css/checktris.css",
				dest: "checktris.min.css"
			},
			options:{
				sourceMap: "checktris.css.map"
			}
		},
		uglify:{
			js:{
				files:{
					"checktris.min.js":["js/checktris.js"]
				}
			},
			options:{
				sourceMap: "chektris.js.map"
			}
		},
		watch:{
			files:["css/*","js/*"],
			tasks:["cssmin","uglify"]
		}
	});
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.registerTask("default",["cssmin:css","uglify:js"]);

}