ARG build_tag
ARG environment

# https://docs.docker.com/engine/reference/builder/#environment-replacement
FROM $build_tag as build

# Create a new image to contain the files output from the build, plus a lightweight OS image to move
# the files to the shared volume at runtime.
FROM arm32v7/debian:stretch
ARG environment

COPY --from=build /source /source

WORKDIR /usr/local/bin

RUN echo "#!/bin/sh" > start.sh && \
    echo "rm -rf \$TARGET_DIR" >> start.sh && \
    echo "mkdir -p \$TARGET_DIR" >> start.sh && \
    echo "cp -r /source/* \$TARGET_DIR" >> start.sh && \
    echo "tail -f /dev/null" >> start.sh && \
    chmod 755 start.sh

ENV TARGET_DIR /sites/$environment
ENTRYPOINT ["/usr/local/bin/start.sh"]
