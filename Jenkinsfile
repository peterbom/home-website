#!groovy

// properties([
//     buildDiscarder(
//         logRotator(
//             artifactDaysToKeepStr: '',
//             artifactNumToKeepStr: '',
//             daysToKeepStr: '',
//             numToKeepStr: '10'
//         )
//     ),
//     pipelineTriggers([
//         pollSCM('* * * * *')
//     ])
// ])

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
            archiveArtifacts 'export/**/*'
        }
    }

    stage('deploy') {
        def folder = env.BRANCH_NAME == 'master'
            ? env.HOME_WEBSITE_FOLDER_PROD
            : env.HOME_WEBSITE_FOLDER_STAGING
            
        def rootPath = env.HOME_WEBSITE_ROOT
        def pathPrev = "${rootPath}/${folder}_prev"
        def pathTemp = "${rootPath}/${folder}_temp"
        def pathDeploy = "${rootPath}/${folder}"

        // Cleanup
        sh "ssh friend@${env.HOME_WEBSITE_IP} sudo rm -rf ${pathTemp}"
        sh "ssh friend@${env.HOME_WEBSITE_IP} sudo rm -rf ${pathPrev}"

        // Initialise folders
        sh "ssh friend@${env.HOME_WEBSITE_IP} mkdir -p ${pathTemp}"
        sh "ssh friend@${env.HOME_WEBSITE_IP} mkdir -p ${pathDeploy}"

        // Copy files to server (temp folder)
        sh "scp -r export/* friend@${env.HOME_WEBSITE_IP}:${pathTemp}/"

        // Switch paths and set folder ownsership
        sh "ssh friend@${env.HOME_WEBSITE_IP} mv ${pathDeploy} ${pathPrev}"
        sh "ssh friend@${env.HOME_WEBSITE_IP} mv ${pathTemp} ${pathDeploy}"
        sh "ssh friend@${env.HOME_WEBSITE_IP} sudo chown www-data:www-data -R ${pathDeploy}"
    }
}
