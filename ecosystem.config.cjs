module.exports = {
  apps: [
    {
      name: "rajyadu-client",
      cwd: "/var/www/rajyadu/oil-client",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "rajyadu-backend",
      cwd: "/var/www/rajyadu/oil-backend",
      script: "java",
      args: "-jar target/oli-0.0.1-SNAPSHOT.jar",
      env: {
        JAVA_HOME: "/usr/lib/jvm/java-17-openjdk-amd64",
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
