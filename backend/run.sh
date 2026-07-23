#!/bin/bash
if [ -d "$(pwd)/.jdk" ]; then
    export JAVA_HOME=$(pwd)/.jdk
    export PATH=$JAVA_HOME/bin:$PATH
fi
mvn spring-boot:run
