module.exports = {
    apps: [{
        name: 'rentbot',
        script: 'index.js',
    }],

    // Deployment Configuration
    deploy: {
        production: {
            "user": "root",
            "host": ["139.162.112.61"],
            "ref": "origin/master",
            "repo": "git@github.com:kk00346/rentbot.git",
            "path": "/root/node/rentbot",
            "post-deploy": "npm install"
        }
    }
};