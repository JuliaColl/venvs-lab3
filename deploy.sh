export $(grep -v '^#' .env | xargs)
rsync -avz . avocadoArmchair@ecv-etic.upf.edu:/home/avocadoArmchair/p3 --exclude /frontend/config.js --exclude /node_modules --exclude .env.dev --exclude .gitignore --exclude /.git
ssh avocadoArmchair@ecv-etic.upf.edu << EOF
    cd /home/avocadoArmchair/p3
    npm install

    mv ./frontend/config.prod.js ./frontend/config.js

    kill -9 \$(lsof -t -i:$PORT)
    npm run prod
EOF