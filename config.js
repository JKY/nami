module.exports.settings =  {
	debug:true,
	port: 3011,
	mongo : {
		host:"localhost",
		port: 27017,
		dbname: "nami",
		serveropt: {
			'auto_reconnect':true,
			 poolSize:5
		},

		dbopt : {
			w:-1
		}
	}
}