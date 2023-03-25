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
                spawnPos: [34, 90],
            },
            {
                position: [15, -202],
                size: [80, 30],
                toRoomId: 2,
                spawnPos: [34, 90],
            },
            {
                position: [202, 15],
                size: [80, 30],
                toRoomId: 3,
                spawnPos: [34, 90],
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
                spawnPos: [34, 90],
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
                    position: [-105, 10, -130],
                    gltf: "data/assets/weapon_catapult.glb",     //TODO deploy
                    scaling: [50, 50, 50],
                    name: "parabolic",
                    rotation: 270
                },
                {
                    scaling: 30,
                    mesh: "planeXZ",
                    material: "target",
                    position: [170, 1, -155],
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
                    description: "Acceleration (m/&sup2;)",
                    id: 'a',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

                v0:
                {
                    value: 50,
                    description: "Initial velocity (v/s)",
                    id: 'v0',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

                alpha:
                {
                    value: 0.8,
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
                this.params.alpha = params.alpha;
            },

            dynamic_objects: [
                {
                    velocity: [-20, 30, 1],
                    position: [-115, 30, -130],
                    running: false,

                    node: {
                        position: [-115, 30, -130],
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
                            params.v0.value * Math.cos(params.alpha),
                            params.v0.value * Math.sin(params.alpha),
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
                spawnPos: [34, 90],
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
                    position: [-202, 0, 0],
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
                    position: [-70, 10, -130],
                    rotation: 50
                }
            ],

            params:
            {
                a1:
                {
                    value: 2,
                    description: "Acceleration blue car (m/&sup2;)",
                    id: 'a1',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

                a2:
                {
                    value: -3,
                    description: "Acceleration red car (m/&sup2;)",
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
                this.params.a1.value = params.a1;
                this.params.a2.value = params.a2;
            },

            dynamic_objects: [
                {
                    velocity: [0, 0, 0],
                    position: [-150, 10, -130],
                    running: false,

                    node: {
                        position: [-150, 10, -130],
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
                    position: [170, 10, -130],
                    running: false,

                    node: {
                        position: [170, 10, -130],
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
                spawnPos: [34, 90],
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
                    path: "assets/parabolic-blackboard.png",
                    name: "parabolic-blackboard"
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
                    description: "Acceleration (m/&sup2;)",
                    id: 'a',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                },

                v0:
                {
                    value: 50,
                    description: "Initial velocity (v/s)",
                    id: 'v0',
                    minValue: null,
                    maxValue: null,
                    type: 'float'
                }

            },

            
            stop: function () {
                if (this.dynamic_objects[0].node.position[1] < 2) {
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