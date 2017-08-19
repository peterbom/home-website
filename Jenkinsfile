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
    //     checkout([
    //         $class: 'GitSCM',
    //         branches: [
    //             [name: '*/master']
    //         ],
    //         doGenerateSubmoduleConfigurations: false,
    //         extensions: [],
    //         submoduleCfg: [],
    //         userRemoteConfigs: [
    //             [
    //                 credentialsId: 'home-gituser-ssh-key',
    //                 url: '<this repo>'
    //             ]
    //         ]
    //     ])
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
        }
    }

    sh 'ls -l'    
}
