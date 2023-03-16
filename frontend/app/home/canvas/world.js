export const world = [
    {
        id: 0,
        name: "Projectile motion",
        walkarea: [400, 400],
        scale: 400, 
        exits: [
            {
               position: [12, -102],
               size: [146, 20],
               toRoomId: 3,
               spawnPos: [34, 90],
            }
         ],

        demo: 
            {
                materials : [
                    {
                        path:"assets/green.png",
                        name: "green_door"
                    }
                ],


                static_objects : [
                    {
                        position: [140, 10, 120],
                        mesh: "cube",
                        color: [0, 1, 0, 1],
                        scaling: [10, 10, 10],
                        name: "parabolic"
                    },
                    {
                        scaling: 50,
                        mesh: "assets/door.obj",
                        material: "green_door",
                        position: [-200, 0, 0],
                        rotation: 90
                    }
                ], 
                
                dynamic_object : {
                    velocity : [-20, 30, 1],
                    position : [-115, 10, -130],
                    running: false,

                    params : 
                    {
                        a : 
                        {
                            value :-9.89,
                            description : "Acceleration (m/&sup2;)"
                        },

                        v0 : 
                        {
                            value : 50,
                            description : "Initial velocity (v/s)"
                        },

                        alpha : 
                        {
                            value : 0.8,
                            description : "Inclination angle (rad)"
                        }
                    },

                    node : {
                        position: [-115, 10, -130],
                        mesh: "cube",
                        color: [1, 0, 0, 1],
                        scaling: [10, 10, 10],
                        name: "parabolic",
                        id : "parabolic"
                    },

                    update : function (dt){
                        if (!this.running) return;
                        const sdt = dt * 5;
                        this.node.position[0] = this.node.position[0] + this.velocity[0] * sdt;
                        this.node.position[1] = this.node.position[1] + this.velocity[1] * sdt + 1 / 2 * this.params.a.value * sdt * sdt;
                        this.node.position[2] = this.node.position[2] + this.velocity[2] * sdt;
                        this.velocity[1] = this.velocity[1] + this.params.a.value * sdt;
                        this.node.position = [...this.node.position];
                        if (this.node.position[1] < +10){
                            this.stop()
                        }
                        return this.node.position;
                    },
                    stop: function(){
                        this.running = false;
                    },
                    start: function(){
                        this.running = true;
                    },
                    reset : function (){
                        this.node.position = [...this.position];
                        this.velocity = [
                            this.params.v0.value*Math.cos(this.params.alpha), 
                            this.params.v0.value*Math.sin(this.params.alpha), 
                            0
                        ];
                    },
                    setParams : function (params){
                        this.params.a.value = params.a;
                        this.params.v0.value = params.v0;
                        this.params.alpha = params.alpha;
                    }
                } 
            }
    }
]