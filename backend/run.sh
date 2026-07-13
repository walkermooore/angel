#!/bin/bash
export JAVA_HOME=$(pwd)/.jdk
export PATH=$JAVA_HOME/bin:$PATH
mvn spring-boot:run
