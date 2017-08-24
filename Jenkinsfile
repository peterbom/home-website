#!groovy

node {
    def node_path = "${tool name: 'NodeJS 8.4.0', type: 'nodejs'}/bin"
    
    //docker.withTool("Docker") {
    //    withDockerServer([credentialsId: 'docker-server-creds', uri: '192.168.1.230']) {
    //        sh "docker images"
    //    }
    //}


    stage('checkout') {
        checkout scm
    }
    
    stage('init') {
        withCredentials([string(credentialsId: 'jspm-github-auth', variable: 'jspm_github_auth')]) {
            withEnv(["PATH+NODEJS=${node_path}", "JSPM_GITHUB_AUTH_TOKEN=${jspm_github_auth}"]) {
                sh "echo ${jspm_github_auth}"
                sh 'npm install'
                sh 'npm run jspm-install'
            }
        }
    }
    
    stage('build') {
        withEnv(["PATH+NODEJS=${node_path}"]) {
            sh 'npm run build-prod-release'
            archiveArtifacts 'dist/**/*'
        }
    }

    stage('deploy') {
        sh "ssh friend@${env.HOME_WEBSITE_IP} sudo rm -rf /mnt/websites/deploy_temp"
        sh "ssh friend@${env.HOME_WEBSITE_IP} mkdir -p /mnt/websites/deploy_temp/"
        sh "scp -r dist friend@${env.HOME_WEBSITE_IP}:/mnt/websites/deploy_temp/"
        sh "ssh friend@${env.HOME_WEBSITE_IP} sudo rm -rf /mnt/websites/deploy_prev"
        sh "ssh friend@${env.HOME_WEBSITE_IP} mv /mnt/websites/${env.HOME_WEBSITE_FOLDER} /mnt/websites/deploy_prev"
        sh "ssh friend@${env.HOME_WEBSITE_IP} mv /mnt/websites/deploy_temp /mnt/websites/${env.HOME_WEBSITE_FOLDER}"
        sh "ssh friend@${env.HOME_WEBSITE_IP} sudo chown www-data:www-data /mnt/websites/${env.HOME_WEBSITE_FOLDER}"
    }

    sh 'ls -l'    
}
