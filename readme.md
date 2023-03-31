# Dev set up
1. Create a .env file
```
DB_PORT=27017
DB_URL=mongodb://localhost:27017/avocadoArmchair-lab3
PORT=9011
```
2. Create a .env.dev file
```
ENV=dev
```
3. Run
```
npm run dev
```

# features
- 3 sample demos for physics subject: accelerated motion, escape velocity, parabolic shot
- Run interactive physics experiments editing the parameters
- When the experiment matches the goal, a "SUCCESS" title appears
- Chat (text and audio) in real-time with other students to collaborate while solving the challenge/problem/experiment
- Use the "measuring tape" feature to measure distances in the 3D space to solve the problem
- You can use emojis in chat messages
- User login and sign up
- Avatars (different skins/colors)
- 3D rotating camera with zoom (scroll for zoom)
- Automatic deployment script (npm run deploy)
- Whiteboards in the demo rooms with related equations, titles and relevant schemas/drawings
- Very minimalistic world, leaving importance/focus to the actual physics/math at hand

# showcase video
[Showcase Video](https://youtu.be/_NtcIWW4SFE)

## Run MongoDB locally
1. Install: https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-database#install-mongodb (until step 8)
2. Run `npm run dev-db`


# Where is prod?
https://ecv-etic.upf.edu/node/9011/

# credits
"Chalkboard" (https://skfb.ly/6GztC) by hellfa is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).