export const world = [
    {
        id: 0,
        name: "Lobby",
        walkarea: [390, 390],
        scale: 400,
        exits: [
            {
                position: [-202, 15],
                size: [80, 30],
                toRoomId: 1,
                spawnPos: [-160, 15],
            },
            {
                position: [-15, -200],
                size: [50, 80],
                toRoomId: 2,
                spawnPos: [-160, 15],
            },
            {
                position: [202, 15],
                size: [80, 30],
                toRoomId: 3,
                spawnPos: [-160, 15],
            }
        ],

        demo:
        {
            materials: [
                {
                    path: "assets/green.png",
                    name: "green_door"
                },
                {
                    path: "assets/red.png",
                    name: "red_door"
                },
                {
                    path: "assets/blue.png",
                    name: "blue_door"
                },
                {
                    path: "assets/title-ufo.png",
                    name: "title-ufo"
                },
                {
                    path: "assets/title-parabolic2.png",
                    name: "title-parabolic"
                },
                {
                    path: "assets/title-cars.png",
                    name: "title-cars"
                }
            ],

            update: function () { },
            stop: function () { },


            static_objects: [
                {
                    scaling: 50,
                    mesh: "assets/door.obj",
                    material: "red_door",
                    position: [0, 0, -202]
                    //rotation: 90
                }, ,
                {
                    scaling: 50,
                    mesh: "assets/door.obj",
                    material: "green_door",
                    position: [-202, 0, 0],
                    rotation: 90
                },
                {
                    scaling: 50,
                    mesh: "assets/door.obj",
                    material: "blue_door",
                    position: [202, 0, 0],
                    rotation: 90
                },
                {
                    scaling: 75,
                    mesh: "plane",
                    material: "title-parabolic",
                    position: [-200, 70, 15],
                    rotation: 90
                },
                {
                    scaling: 75,
                    mesh: "plane",
                    material: "title-ufo",
                    position: [200, 70, 15],
                    rotation: 270
                },
                {
                    scaling: 75,
                    mesh: "plane",
                    material: "title-cars",
                    position: [-15, 70, -200],
                    rotation: 0
                }
            ],

            dynamic_objects: []

        }
    },

    {
        id: 1,
        name: "Projectile motion",
        walkarea: [400, 400],
        scale: 400,
        exits: [
            {
                position: [-202, 15],
                size: [70, 30],
                toRoomId: 0,
                spawnPos: [-160, 15],
            }
        ],

        demo:
        {
            materials: [
                {
                    path: "assets/green.png",
                    name: "green_door"
                },
                {
                    path: "assets/parabolic-blackboard.png",
                    name: "parabolic-blackboard"
                },
                {
                    path: "images/target.png",
                    name: "target"
                }
            ],


            static_objects: [
                {
                    position: [-105, 0, -130],
                    gltf: "data/assets/weapon_catapult.glb",     //TODO deploy
                    scaling: [50, 50, 50],
                    name: "parabolic",
                    rotation: 270
                },
                {
                    scaling: 30,
                    mesh: "planeXZ",
                    material: "target",
                    position: [170, 1, -130],
                    rotation: 50
                },
                {
                    scaling: 50,
                    mesh: "assets/door.obj",
                    material: "green_door",
                    position: [-202, 0, 0],
                    rotation: 90
                },
                {
                    scaling: 0.75,
                    mesh: "assets/blackboard3.obj",
                    material: "parabolic-blackboard",
                    position: [0, 25, -250]
                }
                
            ],

            params:
            {
                a:
                {
                    value: -9.89,
                    description: "Acceleration (u/s&sup2;)",
                    id: 'a',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

                v0:
                {
                    value: 25,
                    description: "Initial velocity (u/s)",
                    id: 'v0',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

                alpha:
                {
                    value: 0.123,
                    description: "Inclination angle (rad)",
                    id: 'alpha',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                }
            },

            
            stop: function () {
                if (this.dynamic_objects[0].node.position[1] < -1) {
                    this.dynamic_objects[0].stop();
                }
            },
            

            start: function () {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.running = true;
                })
            },

            update: function (dt) {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.update(dt, this.params);
                })
            },

            reset: function () {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.reset(this.params);
                })
            },

            setParams: function (params) {
                this.params.a.value = params.a;
                this.params.v0.value = params.v0;
                this.params.alpha.value = params.alpha;
            },

            isCorrect: function (){
                const g = this.params.a.value;
                const v0 = this.params.v0.value;
                const alpha = this.params.alpha.value;

                // y = y0 + v0 * sin(alpha) * tt + g * 1/2 * tt * tt
                const a = g * 1/2;
                const b =  v0 * Math.sin(alpha);
                const c = this.dynamic_objects[0].position[1];

                const r = b*b - 4 * a * c;
                if (r < 0) return false;
                
                var tt = (-b + Math.sqrt(r)) / (2*a);
                tt = (tt > 0) ? tt : (-b - Math.sqrt(r)) / (2*a);

                if (tt < 0) return false;

                // x = x0 + v0 * cos(alpha) * tt
                const x = this.dynamic_objects[0].position[0] + v0 * Math.cos(alpha) * tt;

                const dif = Math.abs( x - this.static_objects[1].position[0]);
                if(dif > 5) return false
                
                return true;                
            },

            dynamic_objects: [
                {
                    velocity: [-20, 30, 0],
                    position: [-115, 20, -130],
                    running: false,

                    node: {
                        position: [-115, 20, -130],
                        gltf: "data/assets/ball.glb",     //TODO deploy
                        scaling: [50, 50, 50],
                        name: "parabolic",
                        id: "parabolic"
                    },

                    update: function (dt, params) {
                        if (!this.running) return;
                        const sdt = dt * 5;
                        this.node.position[0] = this.node.position[0] + this.velocity[0] * sdt;
                        this.node.position[1] = this.node.position[1] + this.velocity[1] * sdt + 1 / 2 * params.a.value * sdt * sdt;
                        this.node.position[2] = this.node.position[2] + this.velocity[2] * sdt;
                        this.velocity[1] = this.velocity[1] + params.a.value * sdt;
                        this.node.position = [...this.node.position];
                        
                        return this.node.position;
                    },

                    stop: function () {
                        this.running = false;
                    },

                    reset: function (params) {
                        this.node.position = [...this.position];
                        this.velocity = [
                            params.v0.value * Math.cos(params.alpha.value),
                            params.v0.value * Math.sin(params.alpha.value),
                            0
                        ];
                    },
                }
            ]
        }
    },

    {
        id: 2,
        name: "cars",
        walkarea: [400, 400],
        scale: 400,
        exits: [
            {
                position: [-202, 15],
                size: [70, 30],
                toRoomId: 0,
                spawnPos: [-15, -160],
            }
        ],

        demo:
        {
            materials: [
                {
                    path: "assets/red.png",
                    name: "red_door"
                },
                {
                    path: "assets/blackboard-mua.png",
                    name: "blackboard-mua"
                },
                {
                    path: "assets/color-atlas-new.png",
                    name: "atlas"
                },
                {
                    path: "images/target.png",
                    name: "target"
                }
            ],


            static_objects: [
                {
                    scaling: 50,
                    mesh: "assets/door.obj",
                    material: "red_door",
                    position: [-205, 0, 0],
                    rotation: 90
                },
                {
                    scaling: 0.75,
                    mesh: "assets/blackboard3.obj",
                    material: "blackboard-mua",
                    position: [0, 25, -250]
                },
                {
                    scaling: 30,
                    mesh: "planeXZ",
                    material: "target",
                    position: [-70, 0.5, -130],
                    rotation: 50
                }
            ],

            params:
            {
                a1:
                {
                    value: 2,
                    description: "Acceleration blue car (u/s&sup2;)",
                    id: 'a1',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

                a2:
                {
                    value: -3,
                    description: "Acceleration red car (u/s&sup2;)",
                    id: 'a2',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

            },

            
            stop: function () {
                var diff = Math.abs(this.dynamic_objects[0].node.position[0] - this.dynamic_objects[1].node.position[0]);
                //console.log(diff)
                if ( diff < 5){     //todo check if 5 is the best offset
                    this.dynamic_objects[0].stop();
                    this.dynamic_objects[1].stop();
                    //return this.isCorrect();

                }
                
                //return false
            },
            

            start: function () {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.running = true;
                })
            },

            update: function (dt) {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.update(dt, this.params);
                })
            },

            reset: function () {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.reset(this.params);
                })

                console.log("reset")
            },

            setParams: function (params) {
                this.params.a1.value = params.a1;
                this.params.a2.value = params.a2;
            },

            isCorrect: function (){
                const a1 = this.params.a1.value;
                const a2 = this.params.a2.value;

                /*
                x1 = x0_1 + v0_1 * tt + 1/2 * a1 * tt * tt = x0_1  + 1/2 * a1 * tt * tt
                x2 = x0_2 + v0_2 * tt + 1/2 * a2 * tt * tt = x0_2  + 1/2 * a2 * tt * tt
                x1 = x2 
                then x0_1  + 1/2 * a1 * tt * tt = x0_2  + 1/2 * a2 * tt * tt
                tt * tt = (x0_2 - x0_1) / (1/2 * a1 - 1/2 * a2)
                */
                const x0_1 = this.dynamic_objects[0].position[0];
                const x0_2 = this.dynamic_objects[1].position[0];

                const tt2 = (x0_2 - x0_1) / (1/2 * a1 - 1/2 * a2);
                if (tt2 < 0) return false;
                
                var tt = Math.sqrt(tt2);

                const x = x0_1 + 1/2 * a1 * tt * tt;

                const dif = Math.abs( x - this.static_objects[2].position[0]);
                if(dif > 5) return false
                
                return true;                
            },

            dynamic_objects: [
                {
                    velocity: [0, 0, 0],
                    position: [-150, 0, -130],
                    running: false,

                    node: {
                        position: [-150, 0, -130],
                        gltf: "data/assets/raceFuture.glb",     //TODO deploy
                        scaling: 7,
                        name: "car1",
                        id: "car1", 
                        rotation: 270,
                    },

                    update: function (dt, params) {
                        if (!this.running) return;

                        const sdt = dt * 5;
                        this.node.position[0] = this.node.position[0] + this.velocity[0] * sdt + 1 / 2 * params.a1.value * sdt * sdt;
                        this.velocity[0] = this.velocity[0] + params.a1.value * sdt;
                        this.node.position = [...this.node.position];

                        
                        if (this.node.position[0] < -200 || this.node.position[0] > 200) {
                            this.stop();
                        }
                        

                        return this.node.position;
                    },

                    stop: function () {
                        this.running = false;
                    },

                    reset: function (params) {
                        this.node.position = [...this.position];
                        this.velocity = [0,0,0];
                    },
                },
                {
                    velocity: [0, 0, 0],
                    position: [170, 0, -130],
                    running: false,

                    node: {
                        position: [170, 0, -130],
                        gltf: "data/assets/race.glb",  //TODO deploy
                        //material: "atlas",
                        scaling: 7,
                        name: "car2",
                        id: "car2",
                        rotation: 90
                    },

                    update: function (dt, params) {
                        if (!this.running) return;

                        const sdt = dt * 5;
                        this.node.position[0] = this.node.position[0] + this.velocity[0] * sdt + 1 / 2 * params.a2.value * sdt * sdt;
                        this.velocity[0] = this.velocity[0] + params.a2.value * sdt;
                        this.node.position = [...this.node.position];

                        
                        if (this.node.position[0] < -200 || this.node.position[0] > 200) {
                            this.stop();
                        }
                        

                        return this.node.position;
                    },

                    stop: function () {
                        this.running = false;
                    },

                    reset: function (params) {
                        this.node.position = [...this.position];
                        this.velocity = [0,0,0];
                    },
                }
            ]
        }
    },

    {
        id: 3,
        name: "Rocket",
        walkarea: [400, 400],
        scale: 400,
        exits: [
            {
                position: [-202, 15],
                size: [70, 30],
                toRoomId: 0,
                spawnPos: [170, 20],
            }
        ],

        demo:
        {
            materials: [
                {
                    path: "assets/blue.png",
                    name: "blue_door"
                },
                {
                    path: "assets/blackboard-ufo.png",
                    name: "ufo-blackboard"
                },
                {
                    path: "assets/color-atlas-new.png",
                    name: "atlas"
                }
            ],


            static_objects: [
                {
                    scaling: 50,
                    mesh: "assets/door.obj",
                    material: "blue_door",
                    position: [-205, 0, 0],
                    rotation: 90
                },
                {
                    scaling: 0.75,
                    mesh: "assets/blackboard3.obj",
                    material: "ufo-blackboard",
                    position: [0, 25, -250]
                },
                {
                    position: [0, 125, -130],
                    mesh: "cube",
                    color: [1, 0, 0, 1],
                    scaling: 4,
                    name: "parabolic"
                }
            ],

            params:
            {
                a:
                {
                    value: -9.89,
                    description: "Acceleration (u/s&sup2;)",
                    id: 'a',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

                v0:
                {
                    value: 20,
                    description: "Initial velocity (u/s)",
                    id: 'v0',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                }

            },

            
            stop: function () {
                if (this.dynamic_objects[0].node.position[1] < 1) {
                    this.dynamic_objects[0].stop();
                    //return this.isCorrect();
                }

                //return false;
            },
            

            start: function () {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.running = true;
                })
            },

            update: function (dt) {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.update(dt, this.params);
                })
            },

            reset: function () {
                this.dynamic_objects.forEach((dynamic_object) => {
                    dynamic_object.reset(this.params);
                })
            },

            setParams: function (params) {
                this.params.a.value = params.a;
                this.params.v0.value = params.v0;
            },

            isCorrect: function (){
                const a = this.params.a.value;
                const v0 = this.params.v0.value;

                // v = v0 + a * tt
                const tt = (-v0 / a); 
                if (tt < 0) return false;

                // y = y0 + v0 * tt + g * 1/2 * tt * tt
                const y = v0 * tt + 1/2 * a * tt * tt;

                const dif = Math.abs( y - this.static_objects[2].position[1]);
                if(dif > 5) return false
                
                return true;                
            },
            
            dynamic_objects: [
                {
                    velocity: [0,0,0],
                    position: [0, 2, -130],
                    running: false,

                    node: {
                        position: [0, 2, -130],
                        mesh: "assets/ufo.obj",
                        material: "atlas",
                        scaling: 2.5,
                        name: "parabolic",
                        id: "parabolic"
                    },

                    update: function (dt, params) {
                        if (!this.running) return;
                        const sdt = dt * 5;
                        this.node.position[1] = this.node.position[1] + this.velocity[1] * sdt + 1 / 2 * params.a.value * sdt * sdt;
                        this.velocity[1] = this.velocity[1] + params.a.value * sdt;
                        this.node.position = [...this.node.position];
                        
                        return this.node.position;
                    },

                    stop: function () {
                        this.running = false;
                    },

                    reset: function (params) {
                        this.node.position = [...this.position];
                        this.velocity = [
                            0,
                            params.v0.value,
                            0
                        ];
                    },
                }
            ]
        }
    }
]