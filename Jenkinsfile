#!groovy

node {
    stage('checkout') {
        checkout scm
    }

	def docker_path = "${tool name: 'Docker', type: 'org.jenkinsci.plugins.docker.commons.tools.DockerTool'}/bin"
	def environment = env.BRANCH_NAME == 'master' ? 'production' : 'staging'
	def repo = "image-registry:5000/home-website:${environment}"

    withEnv(["PATH+DOCKER=${docker_path}"]) {
        stage('build') {
            withCredentials([string(credentialsId: 'jspm-github-auth', variable: 'jspm_github_auth')]) {
                sh "docker build -t ${repo} --build-arg jspm_github_auth=${jspm_github_auth} --build-arg environment=${environment} ."
            }
        }

        stage('push') {
            sh "docker push ${repo}"
        }
    }

	stage('deploy') {
		// https://staxmanade.com/2016/09/how-to-update-a-single-running-docker-compose-container/
		def service_name = env.BRANCH_NAME == 'master' ? 'website' : 'testwebsite'
		def working_dir = env.HOME_ENV_COMPOSE_DIR
		sh "ssh ${env.HOME_ENV_SSH_USERNAME}@${env.HOME_ENV_IP} 'cd ${working_dir} && docker-compose up -d --no-deps --build ${service_name}'"
	}
}
