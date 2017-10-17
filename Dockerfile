FROM node:8.7.0 as builder

# Environment needs to be passed in as 'production' or 'staging'
ARG environment

# JSPM install requires an auth token for connecting to GitHub because it makes so many requests that without
# authentication it frequently exceeds GitHub's rate limit and fails with HTTP 429 responses.
# The token needs to be placed in an environment value called JSPM_GITHUB_AUTH_TOKEN for the JSPM install script
# to use it.
ARG jspm_github_auth
ENV JSPM_GITHUB_AUTH_TOKEN $jspm_github_auth

WORKDIR /src

# Copy just the package.json files first, so that if they haven't changed, we won't have to run npm install again.
COPY package.json package-lock.json /src/
RUN npm install && npm cache clean --force

# Copy the jspm config file next, so that if that hasn't changed, we won't have to run jspm-install again.
COPY config.js /src/
RUN npm run jspm-install

# Copy the rest of the files
COPY . /src/

# Perform the build
RUN npm run build-$environment-release

# Create a new image to contain just the files output from the build. This needs a lightweight OS image to move
# the files to the shared volume at runtime.
FROM arm32v7/debian:jessie
ARG environment

COPY --from=builder /src/export/ /source

WORKDIR /usr/local/bin
RUN echo "#!/bin/sh" > start.sh &&\
    echo "mkdir -p \$1" >> start.sh && \
    echo "rm -rf \$1" >> start.sh && \
    echo "ln -sf /source \$1" && \
    echo "tail -f /dev/null" >> start.sh && \
    chmod 555 start.sh

ENV TARGET_DIR /sites/$environment
ENTRYPOINT ["/usr/local/bin/start.sh"]
CMD ["$TARGET_DIR"]
