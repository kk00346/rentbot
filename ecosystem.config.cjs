module.exports = {
  apps: [{
    script: 'index.js',
    watch: '.'
  }],

  deploy: {
    production: {
      user: 'root',
      host: '139.162.112.61',
      ref: 'origin/master',
      repo: 'git@github.com:kk00346/rentbot.git',
      path: '/root/node/rentbot',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};