#!groovy

node {
    stage('checkout') {
        checkout scm
    }

	def environment = env.BRANCH_NAME == 'master' ? 'production' : 'staging'
	def build_tag = "image-registry:5000/home-website-build:${environment}"
	def deploy_tag = "image-registry:5000/home-website:${environment}"

    stage('build') {
        // The build is divided into two parts. The first is long-running and can be run on any docker host.
        // The output of this is an image containing just files.
        // The second part must be performed on an ARM32 architecture docker host, but should be much faster.
        // Because these steps are happening on different hosts, the intermediate image must be pushed to a
        // registry
        withCredentials([string(credentialsId: 'jspm-github-auth', variable: 'jspm_github_auth')]) {
            sh "docker build -t ${build_tag} -f Dockerfile.build --build-arg jspm_github_auth=${jspm_github_auth} --build-arg environment=${environment} ."
            sh "docker push ${build_tag}"
        }

        docker.withServer(env.ARM32_DOCKER_HOST) {
            sh "docker pull ${build_tag}"
            sh "docker build -t ${deploy_tag} --build-arg build-image=${build_tag} --build-arg environment=${environment} ."
        }
    }

    stage('push') {
        sh "docker push ${deploy_tag}"
    }

	stage('deploy') {
		def service_name = env.BRANCH_NAME == 'master' ? 'website' : 'testwebsite'
		def working_dir = env.HOME_ENV_COMPOSE_DIR
		sh "ssh ${env.HOME_ENV_SSH_USERNAME}@${env.HOME_ENV_IP} 'cd ${working_dir} && docker-compose pull ${service_name}'"
        sh "ssh ${env.HOME_ENV_SSH_USERNAME}@${env.HOME_ENV_IP} 'cd ${working_dir} && docker-compose up -d ${service_name}'"
	}
}
