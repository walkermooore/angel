FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./
COPY src src
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 angell
WORKDIR /app
COPY --from=build /workspace/target/backend-*.jar app.jar
USER 10001
EXPOSE 8081
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
