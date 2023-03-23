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
                }
            ],


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
                }
            ],


            static_objects: [
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
            
            /*
            stop: function () {
                this.running = false;
            },
            */

            start: function () {
                this.dynamic_objects.forEach( (dynamic_object) => {
                    dynamic_object.running = true;
                })
            },

            update: function (dt) {
                this.dynamic_objects.forEach( (dynamic_object) => {
                    dynamic_object.update(dt, this.params);
                })
            }, 

            reset: function(){
                this.dynamic_objects.forEach( (dynamic_object) => {
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
                    position: [-115, 10, -130],
                    running: false,

                    node: {
                        position: [-115, 10, -130],
                        mesh: "cube",
                        color: [1, 0, 0, 1],
                        scaling: [10, 10, 10],
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
                        if (this.node.position[1] < +10) {
                            this.stop();
                        }
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
                    path: "assets/parabolic-blackboard.png",
                    name: "parabolic-blackboard"
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
                    material: "parabolic-blackboard",
                    position: [0, 25, -250]
                }
            ],

            dynamic_objects: [
                {
                    velocity: [-20, 30, 1],
                    position: [-115, 10, -130],
                    running: false,

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

                    node: {
                        position: [-115, 10, -130],
                        mesh: "cube",
                        color: [1, 0, 0, 1],
                        scaling: [10, 10, 10],
                        name: "parabolic",
                        id: "parabolic"
                    },

                    update: function (dt) {
                        if (!this.running) return;
                        const sdt = dt * 5;
                        this.node.position[0] = this.node.position[0] + this.velocity[0] * sdt;
                        this.node.position[1] = this.node.position[1] + this.velocity[1] * sdt + 1 / 2 * this.params.a.value * sdt * sdt;
                        this.node.position[2] = this.node.position[2] + this.velocity[2] * sdt;
                        this.velocity[1] = this.velocity[1] + this.params.a.value * sdt;
                        this.node.position = [...this.node.position];
                        if (this.node.position[1] < +10) {
                            this.stop()
                        }
                        return this.node.position;
                    },
                    stop: function () {
                        this.running = false;
                    },
                    start: function () {
                        this.running = true;
                    },
                    reset: function () {
                        this.node.position = [...this.position];
                        this.velocity = [
                            this.params.v0.value * Math.cos(this.params.alpha),
                            this.params.v0.value * Math.sin(this.params.alpha),
                            0
                        ];
                    },
                    setParams: function (params) {
                        this.params.a.value = params.a;
                        this.params.v0.value = params.v0;
                        this.params.alpha = params.alpha;
                    }
                }
            ]
        }
    }
]