FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y build-essential pkg-config git libjson-c-dev libwebsockets-dev curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Copy repository and build the C server
COPY . /src

RUN make clean && make

EXPOSE 50000

CMD ["/src/server"]
