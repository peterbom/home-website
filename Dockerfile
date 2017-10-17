ARG environment

# Create a new image to contain the files output from the build, plus a lightweight OS image to move
# the files to the shared volume at runtime.
FROM image-registry:5000/home-website-build:$environment as build
FROM alpine:3.6

COPY --from=build /source /source

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
