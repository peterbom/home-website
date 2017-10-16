#!groovy

node {
    stage('checkout') {
        checkout scm
    }

	def environment = env.BRANCH_NAME == 'master' ? 'production' : 'staging'
	def repo = "image-registry:5000/home-website:${environment}"

    stage('build') {
        withCredentials([string(credentialsId: 'jspm-github-auth', variable: 'jspm_github_auth')]) {
            sh "docker build -t ${repo} --build-arg jspm_github_auth=${jspm_github_auth} --build-arg environment=${environment} ."
        }
    }

    stage('push') {
        sh "docker push ${repo}"
    }

	stage('deploy') {
		def service_name = env.BRANCH_NAME == 'master' ? 'website' : 'testwebsite'
		def working_dir = env.HOME_ENV_COMPOSE_DIR
		sh "ssh ${env.HOME_ENV_SSH_USERNAME}@${env.HOME_ENV_IP} 'cd ${working_dir} && docker-compose pull ${service_name}'"
        sh "ssh ${env.HOME_ENV_SSH_USERNAME}@${env.HOME_ENV_IP} 'cd ${working_dir} && docker-compose up -d ${service_name}'"
	}
}
